import numpy as np
import json
import sys

def matrix_factorization(R, P, Q, steps=5000, alpha=0.0002, beta=0.02):
    """
    Performs matrix factorization to predict missing entries in a user-item interaction matrix.

    Parameters:
    - R (numpy array): The user-item interaction matrix with known ratings.
    - P (numpy array): Initial user feature matrix (users x features).
    - Q (numpy array): Initial item feature matrix (items x features).
    - steps (int): Number of iterations for the optimization algorithm.
    - alpha (float): Learning rate for gradient descent.
    - beta (float): Regularization parameter to prevent overfitting.

    Returns:
    - P (numpy array): Optimized user feature matrix.
    - Q.T (numpy array): Optimized item feature matrix (transposed back to original shape).
    """
    # Get the number of latent features (columns in Q)
    K = Q.shape[1]
    # Transpose Q for easier calculations during updates
    Q = Q.T
    # Iterate over the number of steps (epochs)
    for step in range(steps):
        # Loop over all users
        for i in range(len(R)):
            # Loop over all items
            for j in range(len(R[i])):
                # Only consider known ratings (non-zero entries)
                if R[i][j] > 0:
                    # Calculate the error of the prediction for user i and item j
                    eij = R[i][j] - np.dot(P[i, :], Q[:, j])
                    # Update user and item latent feature vectors

                    for k in range(K):
                        # Update user latent features with gradient descent step
                        P[i][k] = P[i][k] + alpha * (2 * eij * Q[k][j] - beta * P[i][k])
                        # Update item latent features with gradient descent step
                        Q[k][j] = Q[k][j] + alpha * (2 * eij * P[i][k] - beta * Q[k][j])

        # Calculate the total error after updates to check for convergence
        eR = np.dot(P, Q)
        e = 0
        # Loop over all users
        for i in range(len(R)):
            # Loop over all items
            for j in range(len(R[i])):
                # Only consider known ratings
                if R[i][j] > 0:
                    # Accumulate squared error between actual and predicted ratings
                    e = e + pow(R[i][j] - np.dot(P[i, :], Q[:, j]), 2)
                    # Add regularization terms to the error
                    for k in range(K):
                        e = e + (beta / 2) * (pow(P[i][k], 2) + pow(Q[k][j], 2))
        # Check if the error is below a threshold to stop early
        if e < 0.001:
            break
    # Return the optimized latent feature matrices (transpose Q back to original shape)
    return P, Q.T

def load_data():
    """
    Loads the interaction matrix data from standard input.

    Returns:
    - data (list): The interaction matrix as a nested list.
    """
    # Debug message to indicate data loading has started
    print("Starting to load data...", file=sys.stderr, flush=True)  # Print to stderr to test
    # Read a line of input from standard input
    data = input()
    if not data: return "Invalid data.";
    # Parse the JSON-formatted string into a Python list
    data = json.loads(data)
    # Debug message to indicate data has been loaded
    print("Data loaded:", data, file=sys.stderr, flush=True)  # Print loaded data
    # Return the loaded data
    return data

def main():
    """
    Main function to execute the recommendation system.
    """
    print("Starting recommendation service...", file=sys.stderr, flush=True)  # Debug start
    # Load the user-item interaction matrix
    interaction_matrix = np.array(load_data())
    print("Loaded interaction matrix:", interaction_matrix, file=sys.stderr, flush=True)  # Send to stderr

    # Get the number of users and items from the interaction matrix
    user_count = len(interaction_matrix)
    item_count = len(interaction_matrix[0])
    # Define the number of latent features to discover
    features = 3

    # Initialize user and item latent feature matrices with random values
    user_vector = np.random.rand(user_count, features)
    item_vector = np.random.rand(item_count, features)

    # Perform matrix factorization to learn the latent features
    user_vector, item_vector = matrix_factorization(interaction_matrix, user_vector, item_vector)
    # Calculate the predicted ratings by multiplying user and item latent feature matrices
    predicted_ratings = np.dot(user_vector, item_vector.T)

    print("Predicted ratings:", predicted_ratings, file=sys.stderr, flush=True)  # Send to stderr
    print(json.dumps(predicted_ratings.tolist()))  # JSON output

if __name__ == '__main__':
    main()
