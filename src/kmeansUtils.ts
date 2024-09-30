export const generateRandomData = (numPoints: number): number[][] => {
    const data: number[][] = [];
    for (let i = 0; i < numPoints; i++) {
        data.push([Math.random() * 100, Math.random() * 100]);
    }
    return data;
};

export const initializeCentroids = (
    data: number[][],
    k: number,
    method: string
): number[][] => {
    if (method === 'Random') {
        const centroids = [];
        const usedIndices = new Set<number>();
        while (centroids.length < k) {
            const index = Math.floor(Math.random() * data.length);
            if (!usedIndices.has(index)) {
                centroids.push(data[index]);
                usedIndices.add(index);
            }
        }
        return centroids;
    }
    if (method === 'FarthestFirst') {
        const centroids = [data[Math.floor(Math.random() * data.length)]];
        while (centroids.length < k) {
            const farthestPoint = data.reduce((farthest, point) => {
                const minDist = centroids.reduce(
                    (min, centroid) => Math.min(min, euclideanDistance(point, centroid)),
                    Infinity
                );
                if (minDist > farthest.dist) {
                    return { point, dist: minDist };
                } else {
                    return farthest;
                }
            }, { point: null, dist: -Infinity } as { point: number[] | null; dist: number });

            if (farthestPoint.point) {
                centroids.push(farthestPoint.point);
            } else {
                break;
            }
        }
        return centroids;
    }
    if (method === 'KMeans++') {
        const centroids = [data[Math.floor(Math.random() * data.length)]];
        while (centroids.length < k) {
            const distances = data.map((point) => {
                return Math.min(
                    ...centroids.map((centroid) => euclideanDistance(point, centroid))
                );
            });
            const sumDistances = distances.reduce((sum, d) => sum + d ** 2, 0);
            const probabilities = distances.map((d) => (d ** 2) / sumDistances);
            const cumulativeProbabilities = probabilities.reduce(
                (acc, p, i) => [...acc, p + (acc[i - 1] || 0)],
                [] as number[]
            );
            const rand = Math.random();
            const index = cumulativeProbabilities.findIndex((cp) => rand < cp);
            centroids.push(data[index]);
        }
        return centroids;
    }

    return [];
};

export const kMeansStep = (
    data: number[][],
    centroids: number[][],
    assignments: number[],
    k: number
): {
    newCentroids: number[][];
    newAssignments: number[];
    converged: boolean;
} => {
    if (centroids.length === 0) return { newCentroids: centroids, newAssignments: assignments, converged: false };

    const newAssignments = data.map((point) => {
        let minDist = Infinity;
        let assignedCluster = -1;
        centroids.forEach((centroid, index) => {
            const dist = euclideanDistance(point, centroid);
            if (dist < minDist) {
                minDist = dist;
                assignedCluster = index;
            }
        });
        return assignedCluster;
    });

    const newCentroids = centroids.map((_, index) => {
        const assignedPoints = data.filter((_, i) => newAssignments[i] === index);
        if (assignedPoints.length === 0) return centroids[index];
        const mean = [
            assignedPoints.reduce((sum, p) => sum + p[0], 0) / assignedPoints.length,
            assignedPoints.reduce((sum, p) => sum + p[1], 0) / assignedPoints.length,
        ];
        return mean;
    });

    const converged = assignments.length > 0 && assignments.every((a, i) => a === newAssignments[i]);

    return {
        newCentroids,
        newAssignments,
        converged,
    };
};

const euclideanDistance = (a: number[], b: number[]): number => {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
};
