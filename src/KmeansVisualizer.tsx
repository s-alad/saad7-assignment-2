import React, { useState, useEffect, useRef } from "react";
import {
	Chart as ChartJS,
	Chart,
	registerables,
} from "chart.js";
import { Scatter } from "react-chartjs-2";
import { ChartData, ChartOptions } from "chart.js";
import {
	generateRandomData,
	initializeCentroids,
	kMeansStep,
} from "./kmeansUtils";
import { getRelativePosition } from "chart.js/helpers";

ChartJS.register(...registerables);

export const KMeansVisualizer: React.FC = () => {
	const [dataPoints, setDataPoints] = useState<number[][]>([]);
	const [centroids, setCentroids] = useState<number[][]>([]);
	const [assignments, setAssignments] = useState<number[]>([]);
	const [initializationMethod, setInitializationMethod] = useState("Random");
	const [step, setStep] = useState(0);
	const [isConverged, setIsConverged] = useState(false);
	const [k, setK] = useState(3);

	const chartRef = useRef<Chart<"scatter">>(null);

	useEffect(() => {
		const data = generateRandomData(100);
		setDataPoints(data);
	}, []);

	useEffect(() => {
		setCentroids([]);
		setAssignments([]);
		setStep(0);
		setIsConverged(false);
	}, [k]);

	useEffect(() => {
		setCentroids([]);
		setAssignments([]);
		setStep(0);
		setIsConverged(false);
	}, [initializationMethod]);

	const handleInitialization = () => {
		if (initializationMethod !== "Manual") {
			const initCentroids = initializeCentroids(
				dataPoints,
				k,
				initializationMethod
			);
			setCentroids(initCentroids);
			setAssignments([]);
			setStep(0);
			setIsConverged(false);
		} else {
			setCentroids([]);
			setAssignments([]);
			setStep(0);
			setIsConverged(false);
		}
	};

	const handleNextStep = () => {
		if (centroids.length !== k) return;

		const { newCentroids, newAssignments, converged } = kMeansStep(
			dataPoints,
			centroids,
			assignments,
			k
		);
		setCentroids(newCentroids);
		setAssignments(newAssignments);
		setStep((prev) => prev + 1);
		setIsConverged(converged);
	};

	const handleRunToConvergence = () => {
		if (centroids.length !== k) return;

		let currentCentroids = centroids;
		let currentAssignments = assignments;
		let converged = false;
		let steps = 0;

		while (!converged) {
			const result = kMeansStep(
				dataPoints,
				currentCentroids,
				currentAssignments,
				k
			);
			currentCentroids = result.newCentroids;
			currentAssignments = result.newAssignments;
			converged = result.converged;
			steps++;
		}

		setCentroids(currentCentroids);
		setAssignments(currentAssignments);
		setStep((prev) => prev + steps);
		setIsConverged(true);
	};

	const handleNewDataset = () => {
		const data = generateRandomData(100);
		setDataPoints(data);
		setCentroids([]);
		setAssignments([]);
		setStep(0);
		setIsConverged(false);
	};

	const handleReset = () => {
		setCentroids([]);
		setAssignments([]);
		setStep(0);
		setIsConverged(false);
	};

	const handleChartClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
		if (initializationMethod === "Manual" && centroids.length < k) {
			const chart = chartRef.current;
			if (!chart) return;

			const canvasPosition = getRelativePosition(
				event.nativeEvent,
				chart as any
			);

			const xScale = chart.scales.x;
			const yScale = chart.scales.y;

			const xValue = xScale.getValueForPixel(canvasPosition.x);
			const yValue = yScale.getValueForPixel(canvasPosition.y);

			if (xValue === undefined || yValue === undefined) {
				return;
			}

			setCentroids([...centroids, [xValue, yValue]]);
		}
	};

	const chartData: ChartData<"scatter"> = {
		datasets: [
			{
				label: "Data Points",
				data: dataPoints.map((point) => ({
					x: point[0],
					y: point[1],
				})),
				backgroundColor: assignments.length
					? assignments.map(
						(clusterIndex) => `hsl(${(clusterIndex * 360) / k}, 100%, 50%)`
					)
					: "gray",
				pointRadius: 5,
			},
			{
				label: "Centroids",
				data: centroids.map((point) => ({ x: point[0], y: point[1] })),
				backgroundColor: "yellow",
				borderColor: "black",
				pointRadius: 8,
				pointBorderWidth: 2,
				pointStyle: "rect",
				type: "scatter" as const,
			},
		],
	};

	const options: ChartOptions<"scatter"> = {
		responsive: true,
		scales: {
			x: {
				type: "linear",
				min: 0,
				max: 100,
			},
			y: {
				type: "linear",
				min: 0,
				max: 100,
			},
		},
		plugins: {
			legend: {
				display: true,
			},
			title: {
				display: true,
				text: "KMeans Clustering Visualization",
			},
		},
	};

	return (
		<div className="kmeans-visualizer">
			<div className="controls">
				<label>
					Number of Centroids (k):
					<input
						type="number"
						min="1"
						max="10"
						value={k}
						onChange={(e) => {
							const value = Number(e.target.value);
							setK(value > 0 ? value : 1);
						}}
					/>
				</label>
				<select
					value={initializationMethod}
					onChange={(e) => setInitializationMethod(e.target.value)}
				>
					<option value="Random">Random</option>
					<option value="FarthestFirst">Farthest First</option>
					<option value="KMeans++">KMeans++</option>
					<option value="Manual">Manual</option>
				</select>
				<button onClick={handleInitialization}>Initialize Centroids</button>
				<button
					onClick={handleNextStep}
					disabled={
						isConverged || centroids.length !== k || dataPoints.length === 0
					}
				>
					Next Step
				</button>
				<button
					onClick={handleRunToConvergence}
					disabled={
						isConverged || centroids.length !== k || dataPoints.length === 0
					}
				>
					Run to Convergence
				</button>
				<button onClick={handleNewDataset}>New Dataset</button>
				<button onClick={handleReset}>Reset</button>
			</div>
			{initializationMethod === "Manual" && (
				<p className="centroid-info">
					Selected {centroids.length} out of {k} centroids.
				</p>
			)}
			<div className="chart">
				<Scatter
					ref={chartRef}
					data={chartData}
					options={options}
					onClick={handleChartClick}
				/>
			</div>
			<div className="step-info">
				<p>Step: {step}</p>
				{isConverged && <p>The algorithm has converged.</p>}
			</div>
		</div>
	);
};
