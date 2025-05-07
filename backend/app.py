# app.py
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import math # Use math.log for scalar, np.log for array if needed later

app = Flask(__name__)
CORS(app) # Enable Cross-Origin Resource Sharing for requests from frontend

# --- Core Model Logic (Python/NumPy) ---

def W(Pk):
    """Utility from mission impact / warm glow (Logarithmic)."""
    price = max(0.0, Pk) # Ensure non-negative
    # Adding a small epsilon to avoid log(1) = 0 if needed, but log(1+x) handles Pk=0
    return math.log(1.0 + price)

def solve_bellman(states, donor_types, tiers_data, transitions, discount_factor, max_iterations=100, tolerance=1e-4):
    """Solves the Bellman equation using Value Iteration with NumPy."""
    print("Solving Bellman (Python)...")
    n_states = len(states)
    n_types = len(donor_types)
    n_tiers_original = len(tiers_data) # Original number of tiers

    if n_states == 0 or n_types == 0:
        print("Warning: No states or donor types. Returning empty solution.")
        return {'V': [], 'policy': []}

    # Map state names to indices for matrix operations
    state_index_map = {name: i for i, name in enumerate(states)}

    # V[state_idx, type_idx]: Expected NPV for the org
    V = np.zeros((n_states, n_types))
    # policy[state_idx, type_idx]: *Original index* of the best tier for the donor (None if none)
    policy = np.full((n_states, n_types), None, dtype=object) # Use object dtype for None

    # Pre-process transitions into NumPy arrays
    P_baseline = np.array(transitions['baseline'], dtype=float)
    # Ensure P_tier_specific is indexed correctly by original tier index
    P_tier_specific_list = transitions.get('tierSpecific', [])
    P_tier_specific = {
        i: np.array(matrix, dtype=float)
        for i, matrix in enumerate(P_tier_specific_list)
        if matrix is not None # Handle potentially sparse tier influences
    }

    print(f"Starting Value Iteration: {n_states} states, {n_types} types, {n_tiers_original} tiers.")
    print(f"Discount Factor: {discount_factor}")

    for iteration in range(max_iterations):
        V_old = V.copy()
        max_diff = 0

        for s_idx in range(n_states):
            current_state_name = states[s_idx]
            for type_idx in range(n_types):
                donor_type = donor_types[type_idx]

                # --- Donor's Decision Process ---
                max_donor_utility = 0.0 # Utility of choosing nothing
                best_tier_original_idx_for_donor = None

                for original_tier_idx, tier in enumerate(tiers_data):
                    if current_state_name in tier.get('availableInStatesNames', []):
                        utility = (donor_type.get('alpha', 0) * W(tier.get('pk', 0)) +
                                   donor_type.get('beta', 0) * tier.get('bk_score', 0) +
                                   donor_type.get('gamma', 0) * tier.get('sk_score', 0) -
                                   tier.get('pk', 0))

                        if utility > max_donor_utility:
                            max_donor_utility = utility
                            best_tier_original_idx_for_donor = original_tier_idx
                # --- End Donor's Decision ---

                policy[s_idx, type_idx] = best_tier_original_idx_for_donor # Store donor's choice

                # --- Organization's Value Calculation ---
                chosen_tier_pk = 0.0
                chosen_tier_ck = 0.0
                P_transition = P_baseline # Default to baseline

                if best_tier_original_idx_for_donor is not None:
                    chosen_tier = tiers_data[best_tier_original_idx_for_donor]
                    chosen_tier_pk = chosen_tier.get('pk', 0.0)
                    chosen_tier_ck = chosen_tier.get('cost', 0.0)
                    if best_tier_original_idx_for_donor in P_tier_specific:
                        P_transition = P_tier_specific[best_tier_original_idx_for_donor]
                    else:
                         print(f"Warning (Bellman): Tier-specific transitions not found for tier index {best_tier_original_idx_for_donor}. Using baseline.")


                # Bellman update: V(s) = R(s, a*) + gamma * P(s'|s, a*) * V(s')
                immediate_net_contribution = chosen_tier_pk - chosen_tier_ck
                # Expected future value: Dot product of transition probabilities and next state values
                # Ensure row exists and V_old has correct shape
                if s_idx < P_transition.shape[0]:
                    expected_future_value = np.dot(P_transition[s_idx, :], V_old[:, type_idx])
                else:
                    print(f"Error (Bellman): State index {s_idx} out of bounds for transition matrix.")
                    expected_future_value = V_old[s_idx, type_idx] # Fallback: assume stay value

                V[s_idx, type_idx] = immediate_net_contribution + discount_factor * expected_future_value

                # Track convergence
                max_diff = max(max_diff, abs(V[s_idx, type_idx] - V_old[s_idx, type_idx]))

        # Check for convergence
        if max_diff < tolerance:
            print(f"Bellman converged in {iteration + 1} iterations. Max diff: {max_diff}")
            break
        if iteration == max_iterations - 1:
            print(f"Warning: Bellman reached max iterations ({max_iterations}) without full convergence. Max diff: {max_diff}")

    # Convert NumPy arrays to lists for JSON serialization
    return {'V': V.tolist(), 'policy': policy.tolist()}


def simulate_donor_journey(initial_distribution_per_state_name, states, donor_types, V_solution, policy, tiers_data, transitions, num_periods):
    """Simulates the donor journey using the optimal policy with NumPy."""
    print("Simulating donor journey (Python)...")
    n_states = len(states)
    n_types = len(donor_types)

    if n_states == 0 or n_types == 0:
        print("Warning: No states or donor types for simulation.")
        return {'yearlyNetContributions': [], 'totalOrgNPV': 0, 'donorCountsByState': []}

    # Map state names to indices
    state_index_map = {name: i for i, name in enumerate(states)}

    # Convert policy back to NumPy array for easier indexing if needed (or keep as list)
    policy_np = np.array(policy, dtype=object)
    V_solution_np = np.array(V_solution, dtype=float)


    # Pre-process transitions
    P_baseline = np.array(transitions['baseline'], dtype=float)
    P_tier_specific_list = transitions.get('tierSpecific', [])
    P_tier_specific = {
        i: np.array(matrix, dtype=float)
        for i, matrix in enumerate(P_tier_specific_list)
         if matrix is not None
    }

    yearly_net_contributions = np.zeros(num_periods)
    # donor_counts_by_state[state_idx, period_idx (0 to num_periods)]
    donor_counts_by_state = np.zeros((n_states, num_periods + 1))
    # current_period_donors[state_idx, type_idx]
    current_period_donors_by_type = np.zeros((n_states, n_types))

    # --- Initialize counts for period 0 ---
    total_initial_donors = 0
    for s_name, s_idx in state_index_map.items():
        count = initial_distribution_per_state_name.get(s_name, 0.0)
        donor_counts_by_state[s_idx, 0] = count
        total_initial_donors += count
        for type_idx, donor_type in enumerate(donor_types):
            current_period_donors_by_type[s_idx, type_idx] = count * donor_type.get('percentage', 0.0)

    print(f"Initial Donor Distribution (by state): {donor_counts_by_state[:, 0]}")
    print(f"Total Initial Donors: {total_initial_donors}")

    # --- Calculate total initial NPV ---
    total_org_npv = np.sum(current_period_donors_by_type * V_solution_np)
    print(f"Calculated Total Initial Org NPV: {total_org_npv:.2f}")

    # --- Simulate period by period ---
    for p in range(num_periods):
        next_period_donors_by_type = np.zeros((n_states, n_types))
        period_net_contribution = 0.0

        for s_idx in range(n_states):
            for type_idx in range(n_types):
                num_donors = current_period_donors_by_type[s_idx, type_idx]
                if num_donors < 1e-9: continue # Skip if negligible donors

                # Determine chosen tier and contribution
                chosen_tier_original_idx = policy_np[s_idx, type_idx]
                Pk = 0.0
                Ck = 0.0
                P_transition = P_baseline # Default

                if chosen_tier_original_idx is not None:
                    # Ensure index is valid
                    if 0 <= chosen_tier_original_idx < len(tiers_data):
                        chosen_tier = tiers_data[chosen_tier_original_idx]
                        Pk = chosen_tier.get('pk', 0.0)
                        Ck = chosen_tier.get('cost', 0.0)
                        if chosen_tier_original_idx in P_tier_specific:
                            P_transition = P_tier_specific[chosen_tier_original_idx]
                        else:
                            print(f"Warning (Sim): Tier-specific transitions not found for tier index {chosen_tier_original_idx}. Using baseline.")
                    else:
                         print(f"Error (Sim): Invalid tier index {chosen_tier_original_idx} in policy. Assuming no tier.")


                period_net_contribution += num_donors * (Pk - Ck)

                # Distribute donors to next states using matrix multiplication
                # Ensure row exists
                if s_idx < P_transition.shape[0]:
                     next_period_donors_by_type[:, type_idx] += num_donors * P_transition[s_idx, :]
                else:
                    print(f"Error (Sim): State index {s_idx} out of bounds for transition matrix. Assuming donors stay.")
                    next_period_donors_by_type[s_idx, type_idx] += num_donors


        yearly_net_contributions[p] = period_net_contribution
        current_period_donors_by_type = next_period_donors_by_type

        # Update total donor counts by state for charting
        donor_counts_by_state[:, p + 1] = np.sum(current_period_donors_by_type, axis=1)

        print(f"End of Period {p + 1}: Total Donors = {np.sum(donor_counts_by_state[:, p + 1]):.2f}, Net Contribution = {period_net_contribution:.2f}")
        # print(f"Donor Distribution: {donor_counts_by_state[:, p + 1]}")


    return {
        'yearlyNetContributions': yearly_net_contributions.tolist(),
        'totalOrgNPV': total_org_npv,
        'donorCountsByState': donor_counts_by_state.tolist() # Convert final result to list for JSON
    }


# --- Flask API Endpoint ---
@app.route('/simulate', methods=['POST'])
def run_simulation_endpoint():
    print("Received simulation request.")
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON payload"}), 400

        # --- Extract and Validate Input Data ---
        personas = data.get('personas')
        tiers = data.get('tiers')
        lifecycle_states_data = data.get('lifecycleStates')
        baseline_transitions_dict = data.get('baselineTransitions')
        tier_influences_dict = data.get('tierInfluences')
        initial_donors_dict = data.get('initialDonors')
        discount_factor = data.get('discountFactor')
        simulation_periods = data.get('simulationPeriods')

        # Basic validation (add more as needed)
        if not all([personas, tiers, lifecycle_states_data, baseline_transitions_dict,
                    tier_influences_dict, initial_donors_dict, discount_factor is not None,
                    simulation_periods is not None]):
             return jsonify({"error": "Missing required input data fields"}), 400

        if not isinstance(personas, list) or not isinstance(tiers, list) or \
           not isinstance(lifecycle_states_data, list) or not isinstance(baseline_transitions_dict, dict) or \
           not isinstance(tier_influences_dict, dict) or not isinstance(initial_donors_dict, dict) or \
           not isinstance(discount_factor, (int, float)) or not isinstance(simulation_periods, int):
            return jsonify({"error": "Invalid data types in input"}), 400

        states = [s['name'] for s in lifecycle_states_data]
        n_states = len(states)
        if n_states == 0:
             return jsonify({"error": "No lifecycle states defined"}), 400


        # --- Prepare Data Structures for Python Functions ---
        # Donor Types (extract relevant fields)
        donor_types = [{'alpha': p.get('alpha', 0),
                        'beta': p.get('beta', 0),
                        'gamma': p.get('gamma', 0),
                        'percentage': p.get('percentage', 0)
                       } for p in personas]

        # Tiers Data (extract relevant fields)
        tiers_data = [{'id': t.get('id'), 'name': t.get('name'),
                       'pk': t.get('pk', 0), 'bk_score': t.get('bk_score', 0),
                       'sk_score': t.get('sk_score', 0), 'cost': t.get('cost', 0),
                       'availableInStatesNames': t.get('availableInStates', [])
                      } for t in tiers]


         # --- Construct Transition Matrices ---
        # Baseline
        P_baseline = np.zeros((n_states, n_states))
        for i, from_state in enumerate(states):
            for j, to_state in enumerate(states):
                P_baseline[i, j] = baseline_transitions_dict.get(from_state, {}).get(to_state, 0.0)
             # Validate row sums
            if n_states > 0 and abs(np.sum(P_baseline[i, :]) - 1.0) > 0.01:
                 print(f"Warning: Baseline transition row for '{from_state}' does not sum to 1. Sum: {np.sum(P_baseline[i, :])}")
                 # Optional: Add normalization here if desired, or rely on frontend validation
                 # row_sum = np.sum(P_baseline[i, :])
                 # if row_sum > 1e-9: P_baseline[i, :] /= row_sum
                 # else: P_baseline[i, i] = 1.0 # Stay in state if sum is zero

        # Tier Specific (sparse structure)
        # Map tier ID to original index
        tier_id_to_index_map = {tier['id']: i for i, tier in enumerate(tiers_data)}
        P_tier_specific_list = [None] * len(tiers_data) # Initialize with None

        for tier_id_str, influences_from in tier_influences_dict.items():
            try:
                tier_id = int(tier_id_str)
                if tier_id in tier_id_to_index_map:
                    original_tier_idx = tier_id_to_index_map[tier_id]
                    tier_matrix = P_baseline.copy() # Start with baseline

                    for from_state, influences_to in influences_from.items():
                        if from_state in states:
                            s_idx = states.index(from_state)
                            influenced_row = P_baseline[s_idx, :].copy() # Copy baseline row
                            for to_state, multiplier in influences_to.items():
                                if to_state in states:
                                    s_prime_idx = states.index(to_state)
                                    influenced_row[s_prime_idx] = max(0.0, influenced_row[s_prime_idx] * multiplier)

                            # Renormalize the influenced row
                            row_sum = np.sum(influenced_row)
                            if row_sum > 1e-9:
                                tier_matrix[s_idx, :] = influenced_row / row_sum
                            else:
                                 print(f"Warning: Tier {tier_id_str} influence zeroed out transitions from '{from_state}'. Defaulting to stay.")
                                 tier_matrix[s_idx, :] = 0.0 # Zero out others
                                 tier_matrix[s_idx, s_idx] = 1.0 # Set self-transition to 1

                    P_tier_specific_list[original_tier_idx] = tier_matrix.tolist() # Store as list for JSON later if needed
                else:
                    print(f"Warning: Tier ID {tier_id_str} from influences not found in tiers list.")
            except ValueError:
                print(f"Warning: Invalid tier ID '{tier_id_str}' in tier influences.")
            except Exception as e_inner:
                 print(f"Error processing influences for tier {tier_id_str}: {e_inner}")


        transitions = {
            'baseline': P_baseline.tolist(), # Convert to list for Bellman function
            'tierSpecific': P_tier_specific_list # List of lists (or None)
        }

        # --- Run Optimization and Simulation ---
        bellman_results = solve_bellman(states, donor_types, tiers_data, transitions, discount_factor)
        if not bellman_results or 'V' not in bellman_results or 'policy' not in bellman_results:
             return jsonify({"error": "Bellman solver failed to produce results."}), 500

        sim_results = simulate_donor_journey(
            initial_donors_dict,
            states,
            donor_types,
            bellman_results['V'],
            bellman_results['policy'],
            tiers_data,
            transitions, # Pass the pre-processed dict
            simulation_periods
        )
        if not sim_results:
             return jsonify({"error": "Simulation failed to produce results."}), 500


        # --- Combine and Return Results ---
        # Policy needs to be mapped back maybe, or handled by frontend using original indices
        final_results = {
            "totalNPV": sim_results['totalOrgNPV'],
            "periodContributions": sim_results['yearlyNetContributions'],
            "donorCountsByState": sim_results['donorCountsByState'],
            "policy": bellman_results['policy'] # Policy uses original tier indices
        }

        print("Simulation successful. Sending results.")
        return jsonify(final_results)

    except Exception as e:
        print(f"Error during simulation endpoint processing: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"An internal server error occurred: {e}"}), 500

# --- Main Execution ---
if __name__ == '__main__':
    # Port 5000 is common for Flask dev, change if needed
    app.run(debug=True, port=5001) # Use a different port like 5001 to avoid conflicts