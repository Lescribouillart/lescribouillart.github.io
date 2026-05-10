(() => {
	'use strict';

	function createStatusUpdater(statusNode) {
		return function updateStatus(message) {
			if (statusNode) {
				statusNode.textContent = message;
			}
		};
	}

	function createCanvas(root) {
		const canvas = document.createElement('canvas');
		canvas.className = 'saga-globe-renderer';
		root.appendChild(canvas);
		return canvas;
	}

	function createStars(count) {
		const stars = [];

		for (let index = 0; index < count; index += 1) {
			stars.push({
				x: Math.random(),
				y: Math.random(),
				radius: Math.random() * 1.7 + 0.2,
				alpha: Math.random() * 0.6 + 0.2
			});
		}

		return stars;
	}

	function rotatePoint(point, yaw, pitch) {
		const cosYaw = Math.cos(yaw);
		const sinYaw = Math.sin(yaw);
		const cosPitch = Math.cos(pitch);
		const sinPitch = Math.sin(pitch);

		const yawX = (point.x * cosYaw) - (point.z * sinYaw);
		const yawZ = (point.x * sinYaw) + (point.z * cosYaw);
		const pitchY = (point.y * cosPitch) - (yawZ * sinPitch);
		const pitchZ = (point.y * sinPitch) + (yawZ * cosPitch);

		return {
			x: yawX,
			y: pitchY,
			z: pitchZ
		};
	}

	function projectPoint(point, radius, centerX, centerY) {
		return {
			x: centerX + (point.x * radius),
			y: centerY + (point.y * radius),
			z: point.z
		};
	}

	function drawLine(ctx, points, alpha, color) {
		if (!points.length) {
			return;
		}

		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);

		for (let index = 1; index < points.length; index += 1) {
			ctx.lineTo(points[index].x, points[index].y);
		}

		ctx.strokeStyle = color;
		ctx.globalAlpha = alpha;
		ctx.stroke();
		ctx.globalAlpha = 1;
	}

	function initGlobe() {
		const root = document.querySelector('[data-saga-globe]');

		if (!root) {
			return;
		}

		const canvasHost = root.querySelector('[data-saga-globe-canvas]');
		const statusNode = root.querySelector('[data-saga-globe-status]');
		const updateStatus = createStatusUpdater(statusNode);

		if (!canvasHost) {
			return;
		}

		const canvas = createCanvas(canvasHost);
		const context = canvas.getContext('2d');

		if (!context) {
			updateStatus('Le navigateur n\'a pas pu initialiser le canvas du globe.');
			return;
		}

		const stars = createStars(180);
		const state = {
			yaw: 0.45,
			pitch: -0.22,
			targetYaw: 0.45,
			targetPitch: -0.22,
			zoom: 1,
			dragging: false,
			pointerId: null,
			lastX: 0,
			lastY: 0
		};

		canvas.style.touchAction = 'none';

		function resizeRenderer() {
			const bounds = canvasHost.getBoundingClientRect();
			const width = Math.max(1, Math.floor(bounds.width));
			const height = Math.max(320, Math.floor(bounds.height));

			canvas.width = Math.floor(width * (window.devicePixelRatio || 1));
			canvas.height = Math.floor(height * (window.devicePixelRatio || 1));
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			context.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
		}

		const resizeObserver = new ResizeObserver(() => {
			resizeRenderer();
		});

		resizeObserver.observe(canvasHost);
		resizeRenderer();
		updateStatus('Globe prêt. Cliquez-glissez pour le faire tourner et utilisez la molette pour zoomer.');

		let animationFrameId = 0;

		function drawBackground(width, height) {
			const gradient = context.createRadialGradient(width * 0.5, height * 0.28, 30, width * 0.5, height * 0.42, width * 0.72);
			gradient.addColorStop(0, 'rgba(89, 133, 196, 0.18)');
			gradient.addColorStop(0.35, 'rgba(16, 26, 42, 0.12)');
			gradient.addColorStop(1, 'rgba(4, 8, 14, 0)');
			context.fillStyle = gradient;
			context.fillRect(0, 0, width, height);

			for (let index = 0; index < stars.length; index += 1) {
				const star = stars[index];
				context.beginPath();
				context.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
				context.fillStyle = `rgba(207, 227, 255, ${star.alpha})`;
				context.fill();
			}
		}

		function drawGlobe(width, height) {
			const centerX = width * 0.5;
			const centerY = height * 0.52;
			const radius = Math.min(width, height) * 0.31 * state.zoom;

			const atmosphereGradient = context.createRadialGradient(centerX - (radius * 0.28), centerY - (radius * 0.36), radius * 0.18, centerX, centerY, radius * 1.36);
			atmosphereGradient.addColorStop(0, 'rgba(148, 195, 255, 0.34)');
			atmosphereGradient.addColorStop(0.55, 'rgba(84, 127, 176, 0.1)');
			atmosphereGradient.addColorStop(1, 'rgba(84, 127, 176, 0)');
			context.fillStyle = atmosphereGradient;
			context.beginPath();
			context.arc(centerX, centerY, radius * 1.34, 0, Math.PI * 2);
			context.fill();

			const sphereGradient = context.createRadialGradient(centerX - (radius * 0.32), centerY - (radius * 0.35), radius * 0.15, centerX, centerY, radius);
			sphereGradient.addColorStop(0, '#729bd0');
			sphereGradient.addColorStop(0.5, '#456c99');
			sphereGradient.addColorStop(1, '#16263d');
			context.fillStyle = sphereGradient;
			context.beginPath();
			context.arc(centerX, centerY, radius, 0, Math.PI * 2);
			context.fill();

			context.save();
			context.beginPath();
			context.arc(centerX, centerY, radius, 0, Math.PI * 2);
			context.clip();

			context.lineWidth = 1.1;

			for (let latitude = -60; latitude <= 60; latitude += 15) {
				const latitudeRadians = latitude * (Math.PI / 180);
				const points = [];

				for (let longitude = -180; longitude <= 180; longitude += 4) {
					const longitudeRadians = longitude * (Math.PI / 180);
					const point = {
						x: Math.cos(latitudeRadians) * Math.cos(longitudeRadians),
						y: Math.sin(latitudeRadians),
						z: Math.cos(latitudeRadians) * Math.sin(longitudeRadians)
					};
					const rotated = rotatePoint(point, state.yaw, state.pitch);

					if (rotated.z > -0.18) {
						points.push(projectPoint(rotated, radius, centerX, centerY));
					} else if (points.length > 1) {
						drawLine(context, points, 0.17, 'rgba(184, 216, 255, 1)');
						points.length = 0;
					} else {
						points.length = 0;
					}
				}

				if (points.length > 1) {
					drawLine(context, points, 0.17, 'rgba(184, 216, 255, 1)');
				}
			}

			for (let longitude = 0; longitude < 180; longitude += 15) {
				const longitudeRadians = longitude * (Math.PI / 180);
				const points = [];

				for (let latitude = -90; latitude <= 90; latitude += 3) {
					const latitudeRadians = latitude * (Math.PI / 180);
					const point = {
						x: Math.cos(latitudeRadians) * Math.cos(longitudeRadians),
						y: Math.sin(latitudeRadians),
						z: Math.cos(latitudeRadians) * Math.sin(longitudeRadians)
					};
					const rotated = rotatePoint(point, state.yaw, state.pitch);

					if (rotated.z > -0.18) {
						points.push(projectPoint(rotated, radius, centerX, centerY));
					} else if (points.length > 1) {
						drawLine(context, points, 0.12, 'rgba(164, 199, 255, 1)');
						points.length = 0;
					} else {
						points.length = 0;
					}
				}

				if (points.length > 1) {
					drawLine(context, points, 0.12, 'rgba(164, 199, 255, 1)');
				}
			}

			context.restore();

			context.strokeStyle = 'rgba(198, 222, 255, 0.3)';
			context.lineWidth = 1.5;
			context.beginPath();
			context.arc(centerX, centerY, radius, 0, Math.PI * 2);
			context.stroke();
		}

		function clampPitch(value) {
			return Math.max(-1.1, Math.min(1.1, value));
		}

		canvas.addEventListener('pointerdown', (event) => {
			state.dragging = true;
			state.pointerId = event.pointerId;
			state.lastX = event.clientX;
			state.lastY = event.clientY;
			canvas.setPointerCapture(event.pointerId);
		});

		canvas.addEventListener('pointermove', (event) => {
			if (!state.dragging || state.pointerId !== event.pointerId) {
				return;
			}

			const deltaX = event.clientX - state.lastX;
			const deltaY = event.clientY - state.lastY;
			state.lastX = event.clientX;
			state.lastY = event.clientY;
			state.targetYaw += deltaX * 0.008;
			state.targetPitch = clampPitch(state.targetPitch + (deltaY * 0.008));
		});

		function releasePointer(event) {
			if (state.pointerId !== event.pointerId) {
				return;
			}

			state.dragging = false;
			canvas.releasePointerCapture(event.pointerId);
			state.pointerId = null;
		}

		canvas.addEventListener('pointerup', releasePointer);
		canvas.addEventListener('pointercancel', releasePointer);
		canvas.addEventListener('pointerleave', releasePointer);

		canvas.addEventListener('wheel', (event) => {
			event.preventDefault();
			const direction = event.deltaY > 0 ? -0.08 : 0.08;
			state.zoom = Math.max(0.72, Math.min(1.75, state.zoom + direction));
		}, { passive: false });

		function animate() {
			animationFrameId = window.requestAnimationFrame(animate);
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;

			context.clearRect(0, 0, width, height);
			drawBackground(width, height);

			state.yaw += (state.targetYaw - state.yaw) * 0.08;
			state.pitch += (state.targetPitch - state.pitch) * 0.08;
			drawGlobe(width, height);
		}

		animate();

		window.addEventListener('beforeunload', () => {
			window.cancelAnimationFrame(animationFrameId);
			resizeObserver.disconnect();
		}, { once: true });
	}

	document.addEventListener('DOMContentLoaded', initGlobe);
})();
