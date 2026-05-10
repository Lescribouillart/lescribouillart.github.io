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

	function loadPlanetTexture() {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = () => reject(new Error('Impossible de charger planete.png'));
			image.src = '../images/Map/planete.png';
		});
	}

	function createTextureBuffer(image) {
		const canvas = document.createElement('canvas');
		canvas.width = image.width;
		canvas.height = image.height;
		const context = canvas.getContext('2d');

		if (!context) {
			return null;
		}

		context.drawImage(image, 0, 0);
		return {
			width: image.width,
			height: image.height,
			data: context.getImageData(0, 0, image.width, image.height).data
		};
	}

	function createRenderBuffer(size) {
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const context = canvas.getContext('2d');

		if (!context) {
			return null;
		}

		return { canvas, context, size };
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

	function createNebulaBlobs() {
		return [
			{ x: 0.5, y: 0.48, rx: 0.52, ry: 0.38, color: 'rgba(49, 123, 177, 0.16)' },
			{ x: 0.52, y: 0.5, rx: 0.34, ry: 0.24, color: 'rgba(79, 159, 212, 0.12)' },
			{ x: 0.38, y: 0.64, rx: 0.3, ry: 0.2, color: 'rgba(32, 93, 160, 0.14)' },
			{ x: 0.66, y: 0.34, rx: 0.28, ry: 0.18, color: 'rgba(55, 134, 173, 0.08)' }
		];
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

	function inverseRotatePoint(point, yaw, pitch) {
		const cosYaw = Math.cos(yaw);
		const sinYaw = Math.sin(yaw);
		const cosPitch = Math.cos(pitch);
		const sinPitch = Math.sin(pitch);

		const baseY = (point.y * cosPitch) + (point.z * sinPitch);
		const baseZ = (-point.y * sinPitch) + (point.z * cosPitch);

		return {
			x: (point.x * cosYaw) + (baseZ * sinYaw),
			y: baseY,
			z: (-point.x * sinYaw) + (baseZ * cosYaw)
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

	function blendValue(start, end, ratio) {
		return (start * (1 - ratio)) + (end * ratio);
	}

	function blendColor(start, end, ratio) {
		return {
			red: blendValue(start.red, end.red, ratio),
			green: blendValue(start.green, end.green, ratio),
			blue: blendValue(start.blue, end.blue, ratio)
		};
	}

	function sampleTexturePixel(textureBuffer, u, v) {
		const sourcePixels = textureBuffer.data;
		const textureWidth = textureBuffer.width;
		const textureHeight = textureBuffer.height;
		const wrappedX = (((u % 1) + 1) % 1) * textureWidth;
		const clampedY = Math.min(textureHeight - 1, Math.max(0, v * (textureHeight - 1)));
		const x0 = Math.floor(wrappedX) % textureWidth;
		const x1 = (x0 + 1) % textureWidth;
		const y0 = Math.floor(clampedY);
		const y1 = Math.min(textureHeight - 1, y0 + 1);
		const blendX = wrappedX - Math.floor(wrappedX);
		const blendY = clampedY - y0;

		const topLeftOffset = (y0 * textureWidth + x0) * 4;
		const topRightOffset = (y0 * textureWidth + x1) * 4;
		const bottomLeftOffset = (y1 * textureWidth + x0) * 4;
		const bottomRightOffset = (y1 * textureWidth + x1) * 4;

		const topColor = {
			red: blendValue(sourcePixels[topLeftOffset], sourcePixels[topRightOffset], blendX),
			green: blendValue(sourcePixels[topLeftOffset + 1], sourcePixels[topRightOffset + 1], blendX),
			blue: blendValue(sourcePixels[topLeftOffset + 2], sourcePixels[topRightOffset + 2], blendX)
		};
		const bottomColor = {
			red: blendValue(sourcePixels[bottomLeftOffset], sourcePixels[bottomRightOffset], blendX),
			green: blendValue(sourcePixels[bottomLeftOffset + 1], sourcePixels[bottomRightOffset + 1], blendX),
			blue: blendValue(sourcePixels[bottomLeftOffset + 2], sourcePixels[bottomRightOffset + 2], blendX)
		};

		return blendColor(topColor, bottomColor, blendY);
	}

	function sampleTextureColor(textureBuffer, u, v) {
		const baseColor = sampleTexturePixel(textureBuffer, u, v);
		const seamBlendWidth = 0.035;
		const seamDistance = Math.min(u, 1 - u);

		if (seamDistance >= seamBlendWidth) {
			return baseColor;
		}

		const seamRatio = 1 - (seamDistance / seamBlendWidth);
		const neighboringLeft = sampleTexturePixel(textureBuffer, seamBlendWidth + seamDistance, v);
		const neighboringRight = sampleTexturePixel(textureBuffer, 1 - seamBlendWidth - seamDistance, v);
		const seamColor = blendColor(neighboringLeft, neighboringRight, 0.5);

		return blendColor(baseColor, seamColor, seamRatio * 0.92);
	}

	function drawTexturedSphere(renderBuffer, textureBuffer, yaw, pitch) {
		const size = renderBuffer.size;
		const center = size * 0.5;
		const radius = center - 2;
		const image = renderBuffer.context.createImageData(size, size);
		const pixels = image.data;

		for (let y = 0; y < size; y += 1) {
			for (let x = 0; x < size; x += 1) {
				const offset = (y * size + x) * 4;
				const normalizedX = ((x + 0.5) - center) / radius;
				const normalizedY = (center - (y + 0.5)) / radius;
				const distanceSquared = (normalizedX * normalizedX) + (normalizedY * normalizedY);

				if (distanceSquared > 1) {
					pixels[offset + 3] = 0;
					continue;
				}

				const visiblePoint = {
					x: normalizedX,
					y: normalizedY,
					z: Math.sqrt(1 - distanceSquared)
				};
				const globePoint = inverseRotatePoint(visiblePoint, yaw, pitch);
				const longitude = Math.atan2(globePoint.z, globePoint.x);
				const latitude = Math.asin(globePoint.y);
				const u = (1 - (((longitude / (Math.PI * 2)) + 1) % 1)) % 1;
				const v = (0.5 - (latitude / Math.PI));
				const sampledColor = sampleTextureColor(textureBuffer, u, v);
				const lighting = 0.7 + (visiblePoint.z * 0.38);

				pixels[offset] = Math.min(255, Math.round(sampledColor.red * lighting));
				pixels[offset + 1] = Math.min(255, Math.round(sampledColor.green * lighting));
				pixels[offset + 2] = Math.min(255, Math.round(sampledColor.blue * lighting));
				pixels[offset + 3] = 255;
			}
		}

		renderBuffer.context.putImageData(image, 0, 0);
	}

	async function initGlobe() {
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

		let planetTexture;

		try {
			planetTexture = await loadPlanetTexture();
		} catch (error) {
			console.error(error);
			updateStatus('La texture du globe n\'a pas pu être chargée.');
			return;
		}

		const textureBuffer = createTextureBuffer(planetTexture);
		const renderBuffer = createRenderBuffer(320);

		if (!textureBuffer || !renderBuffer) {
			updateStatus('Le navigateur n\'a pas pu préparer la texture 3D du globe.');
			return;
		}

		const stars = createStars(180);
		const nebulaBlobs = createNebulaBlobs();
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
		updateStatus('Globe 3D texturé prêt. Cliquez-glissez pour le faire tourner et utilisez la molette pour zoomer.');

		let animationFrameId = 0;

		function drawBackground(width, height) {
			context.fillStyle = '#0b1637';
			context.fillRect(0, 0, width, height);

			for (let index = 0; index < nebulaBlobs.length; index += 1) {
				const blob = nebulaBlobs[index];
				context.beginPath();
				context.ellipse(width * blob.x, height * blob.y, width * blob.rx, height * blob.ry, 0, 0, Math.PI * 2);
				context.fillStyle = blob.color;
				context.fill();
			}

			const gradient = context.createRadialGradient(width * 0.5, height * 0.28, 30, width * 0.5, height * 0.42, width * 0.72);
			gradient.addColorStop(0, 'rgba(112, 176, 233, 0.18)');
			gradient.addColorStop(0.35, 'rgba(22, 51, 97, 0.12)');
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

			const atmosphereGradient = context.createRadialGradient(centerX - (radius * 0.28), centerY - (radius * 0.32), radius * 0.16, centerX, centerY, radius * 1.4);
			atmosphereGradient.addColorStop(0, 'rgba(183, 225, 255, 0.3)');
			atmosphereGradient.addColorStop(0.55, 'rgba(120, 180, 243, 0.12)');
			atmosphereGradient.addColorStop(1, 'rgba(84, 127, 176, 0)');
			context.fillStyle = atmosphereGradient;
			context.beginPath();
			context.arc(centerX, centerY, radius * 1.34, 0, Math.PI * 2);
			context.fill();

			const sphereGradient = context.createRadialGradient(centerX - (radius * 0.32), centerY - (radius * 0.35), radius * 0.12, centerX, centerY, radius);
			sphereGradient.addColorStop(0, '#8fd5ff');
			sphereGradient.addColorStop(0.55, '#5d8fd3');
			sphereGradient.addColorStop(1, '#15346f');
			context.fillStyle = sphereGradient;
			context.beginPath();
			context.arc(centerX, centerY, radius, 0, Math.PI * 2);
			context.fill();

			context.save();
			context.beginPath();
			context.arc(centerX, centerY, radius, 0, Math.PI * 2);
			context.clip();

			drawTexturedSphere(renderBuffer, textureBuffer, state.yaw, state.pitch);
			context.drawImage(renderBuffer.canvas, centerX - radius, centerY - radius, radius * 2, radius * 2);

			const highlight = context.createRadialGradient(centerX - (radius * 0.34), centerY - (radius * 0.36), radius * 0.08, centerX, centerY, radius * 1.05);
			highlight.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
			highlight.addColorStop(0.24, 'rgba(255, 255, 255, 0.1)');
			highlight.addColorStop(0.62, 'rgba(255, 255, 255, 0)');
			highlight.addColorStop(1, 'rgba(7, 16, 48, 0.22)');
			context.fillStyle = highlight;
			context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

			context.restore();

			context.strokeStyle = 'rgba(232, 247, 255, 0.92)';
			context.lineWidth = 2.8;
			context.beginPath();
			context.arc(centerX, centerY, radius, 0, Math.PI * 2);
			context.stroke();
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
			state.targetYaw -= deltaX * 0.008;
			state.targetPitch += deltaY * 0.008;
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
