"""Same two calls the matcher needs when scikit-learn is not installed.

sklearn.preprocessing.StandardScaler scales each column to an average of
0. sklearn.neighbors.NearestNeighbors finds the closest rows. This file
does those two jobs with plain Python so the project still runs on the
campus image. knn_matcher.py uses the real scikit-learn classes when
they import successfully.
"""

import math


class StandardScaler:
    def fit_transform(self, rows):
        self._fit(rows)
        return self.transform(rows)

    def transform(self, rows):
        scaled = []
        for row in rows:
            scaled.append(
                [
                    (float(value) - mean) / scale
                    for value, mean, scale in zip(row, self.mean_, self.scale_)
                ]
            )
        return scaled

    def _fit(self, rows):
        matrix = [list(map(float, row)) for row in rows]
        width = len(matrix[0])
        self.mean_ = []
        self.scale_ = []
        count = float(len(matrix))
        for column in range(width):
            values = [row[column] for row in matrix]
            mean = sum(values) / count
            # Same spread measure as scikit-learn: the population standard deviation.
            variance = sum((value - mean) ** 2 for value in values) / count
            spread = math.sqrt(variance)
            self.mean_.append(mean)
            self.scale_.append(spread if spread > 1e-12 else 1.0)


class NearestNeighbors:
    def __init__(self, n_neighbors=5, algorithm="auto"):
        self.n_neighbors = n_neighbors
        self.algorithm = algorithm
        self._rows = []

    def fit(self, rows):
        self._rows = [list(map(float, row)) for row in rows]
        return self

    def kneighbors(self, queries, n_neighbors=None):
        neighbor_count = n_neighbors or self.n_neighbors
        distances = []
        indexes = []
        for query in queries:
            scored = []
            query_values = list(map(float, query))
            for index, row in enumerate(self._rows):
                distance = math.sqrt(
                    sum((left - right) ** 2 for left, right in zip(query_values, row))
                )
                scored.append((distance, index))
            scored.sort(key=lambda item: item[0])
            chosen = scored[:neighbor_count]
            distances.append([item[0] for item in chosen])
            indexes.append([item[1] for item in chosen])
        return distances, indexes
