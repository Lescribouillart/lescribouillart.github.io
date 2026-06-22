(() => {
	'use strict';

	function createStatusUpdater(statusNode) {
		return function updateStatus(message) {
			if (statusNode) {
				statusNode.hidden = !message;
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
		const imageData = context.getImageData(0, 0, image.width, image.height);
		const seamWidth = Math.max(2, Math.floor(image.width * 0.006));

		for (let y = 0; y < image.height; y += 1) {
			for (let step = 0; step < seamWidth; step += 1) {
				const ratio = (seamWidth - step) / (seamWidth + 1);
				const leftX = step;
				const rightX = image.width - 1 - step;
				const leftOffset = (y * image.width + leftX) * 4;
				const rightOffset = (y * image.width + rightX) * 4;

				for (let channel = 0; channel < 3; channel += 1) {
					const leftValue = imageData.data[leftOffset + channel];
					const rightValue = imageData.data[rightOffset + channel];
					const averageValue = (leftValue + rightValue) * 0.5;
					imageData.data[leftOffset + channel] = Math.round((leftValue * (1 - ratio)) + (averageValue * ratio));
					imageData.data[rightOffset + channel] = Math.round((rightValue * (1 - ratio)) + (averageValue * ratio));
				}
			}
		}

		return {
			width: image.width,
			height: image.height,
			data: imageData.data
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

	function getRenderBufferSize(textureBuffer) {
		const pixelRatio = window.devicePixelRatio || 1;
		const scaledSize = Math.round(640 * pixelRatio);
		const textureLimitedSize = Math.round(textureBuffer.width * 0.6);

		return Math.max(640, Math.min(1024, scaledSize, textureLimitedSize));
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
			y: centerY - (point.y * radius),
			z: point.z
		};
	}

	function createPointFromCoordinates(latitude, longitude) {
		const latitudeRadians = latitude * (Math.PI / 180);
		const longitudeRadians = longitude * (Math.PI / 180);
		const cosLatitude = Math.cos(latitudeRadians);

		return {
			x: cosLatitude * Math.cos(longitudeRadians),
			y: Math.sin(latitudeRadians),
			z: -cosLatitude * Math.sin(longitudeRadians)
		};
	}

	function createCoordinatesFromPoint(point) {
		return {
			latitude: Math.asin(point.y) * (180 / Math.PI),
			longitude: Math.atan2(-point.z, point.x) * (180 / Math.PI)
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
				const sampledColor = sampleTexturePixel(textureBuffer, u, v);
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
		const firstLoadingStepDuration = 900;
		const secondLoadingStepDuration = 1100;

		if (!root) {
			return;
		}

		const canvasHost = root.querySelector('[data-saga-globe-canvas]');
		const loaderNode = root.querySelector('[data-saga-globe-loader]');
		const accessNode = root.querySelector('[data-saga-globe-access]');
		const accessButtonNode = root.querySelector('[data-saga-globe-access-button]');
		const fullscreenButtonNode = root.querySelector('[data-saga-globe-fullscreen]');
		const loaderBarNode = root.querySelector('[data-saga-globe-loader-bar]');
		const statusNode = root.querySelector('[data-saga-globe-status]');
		const viewerPanelNode = root.querySelector('[data-saga-viewer-panel]') || document.querySelector('[data-saga-viewer-panel]');
		const viewerDialogNode = viewerPanelNode;
		const viewerTitleNode = root.querySelector('[data-saga-viewer-title]') || document.querySelector('[data-saga-viewer-title]');
		const viewerImageNode = root.querySelector('[data-saga-viewer-image]') || document.querySelector('[data-saga-viewer-image]');
		const viewerFallbackNode = root.querySelector('[data-saga-viewer-fallback]') || document.querySelector('[data-saga-viewer-fallback]');
		const viewerDotNode = root.querySelector('.saga-globe-viewer-dot') || document.querySelector('.saga-globe-viewer-dot');
		const viewerLoadingNode = root.querySelector('[data-saga-viewer-loading]') || document.querySelector('[data-saga-viewer-loading]');
		const viewerLoadingBarNode = root.querySelector('[data-saga-viewer-loading-bar]') || document.querySelector('[data-saga-viewer-loading-bar]');
		const viewerFullscreenButtonNode = root.querySelector('[data-saga-viewer-fullscreen]') || document.querySelector('[data-saga-viewer-fullscreen]');
		const viewerCloseNodes = root.querySelectorAll('[data-saga-viewer-close]').length
			? root.querySelectorAll('[data-saga-viewer-close]')
			: document.querySelectorAll('[data-saga-viewer-close]');
		const updateStatus = createStatusUpdater(statusNode);
		const franceView = {
			title: 'Carte de la France',
			imageSrc: '../images/Map/france/francefull.png',
			alt: 'Carte de la France'
		};
		let progressAnimationFrameId = 0;
		let currentLoadingProgress = 0;
		let viewerLoadRequestId = 0;

		function setViewerLoadingProgress(value) {
			if (!viewerLoadingBarNode) {
				return;
			}

			const clamped = Math.max(0, Math.min(100, value));
			viewerLoadingBarNode.style.transform = `scaleX(${clamped / 100})`;
		}

		function animateViewerLoadingProgress(startValue, endValue, duration) {
			if (!viewerLoadingBarNode || duration <= 0) {
				setViewerLoadingProgress(endValue);
				return Promise.resolve();
			}

			const startTime = window.performance.now();

			return new Promise((resolve) => {
				const tick = (now) => {
					const ratio = Math.min(1, (now - startTime) / duration);
					setViewerLoadingProgress(startValue + ((endValue - startValue) * ratio));

					if (ratio < 1) {
						window.requestAnimationFrame(tick);
						return;
					}

					resolve();
				};

				window.requestAnimationFrame(tick);
			});
		}

		function isViewerOpen() {
			return Boolean(viewerPanelNode && !viewerPanelNode.hidden);
		}

		function updateViewerFullscreenButtonLabel() {
			if (!viewerFullscreenButtonNode) {
				return;
			}

			const hasActiveFullscreen = Boolean(document.fullscreenElement);
			const label = hasActiveFullscreen ? 'Quitter plein ecran' : 'Plein ecran';
			viewerFullscreenButtonNode.setAttribute('aria-label', label);
			viewerFullscreenButtonNode.setAttribute('title', label);
		}

		function closeViewerPanel() {
			if (!viewerPanelNode || viewerPanelNode.hidden) {
				return;
			}

			viewerLoadRequestId += 1;

			if (document.fullscreenElement === viewerDialogNode) {
				document.exitFullscreen().catch(() => {});
			}

			viewerPanelNode.hidden = true;

			if (viewerLoadingNode) {
				viewerLoadingNode.hidden = true;
			}

			setViewerLoadingProgress(0);

			if (viewerFallbackNode) {
				viewerFallbackNode.hidden = true;
			}

			if (viewerImageNode) {
				viewerImageNode.hidden = true;
			}

			if (viewerDotNode) {
				viewerDotNode.style.display = 'none';
				if (viewerDotNode._positionHandler) {
					window.removeEventListener('resize', viewerDotNode._positionHandler);
					viewerDotNode._positionHandler = null;
				}
			}
		}

		async function openViewerPanel(config) {
			if (!viewerPanelNode) {
				return;
			}

			const requestId = ++viewerLoadRequestId;

			viewerPanelNode.hidden = false;
			if (viewerFullscreenButtonNode) {
				viewerFullscreenButtonNode.hidden = !Boolean(document.fullscreenEnabled && viewerDialogNode);
			}
			updateViewerFullscreenButtonLabel();

			if (viewerTitleNode) {
				viewerTitleNode.textContent = config.title;
			}

			if (viewerImageNode) {
				viewerImageNode.hidden = true;
			}

			if (viewerFallbackNode) {
				viewerFallbackNode.hidden = true;
			}

			if (viewerLoadingNode) {
				// Ne pas afficher la barre de chargement pour la carte de la France
				if (config.imageSrc && config.imageSrc.indexOf('francefull.png') !== -1) {
					viewerLoadingNode.hidden = true;
					setViewerLoadingProgress(100);
				} else {
					viewerLoadingNode.hidden = false;
				}
			}

			setViewerLoadingProgress(0);
			const loadingStagePromise = (viewerLoadingNode && !viewerLoadingNode.hidden)
				? animateViewerLoadingProgress(0, 65, 650)
				: Promise.resolve();

			if (viewerImageNode) {
				viewerImageNode.alt = config.alt;
				const imageLoadPromise = new Promise((resolve) => {
					viewerImageNode.onload = () => resolve(true);
					viewerImageNode.onerror = () => resolve(false);
					viewerImageNode.src = config.imageSrc;
				});

				const [loaded] = await Promise.all([imageLoadPromise, loadingStagePromise]);

				if (requestId !== viewerLoadRequestId) {
					return;
				}

				await animateViewerLoadingProgress(65, 100, 280);

				if (requestId !== viewerLoadRequestId) {
					return;
				}

				if (viewerLoadingNode) {
					viewerLoadingNode.hidden = true;
				}

				if (loaded) {
					viewerImageNode.hidden = false;
					if (viewerFallbackNode) {
						viewerFallbackNode.hidden = true;
					}

					// positionner le point rouge sur l'image pour correspondre au marqueur du globe
					if (viewerDotNode) {
						const findRedPixelInImage = (img) => {
							try {
								const w = img.naturalWidth;
								const h = img.naturalHeight;
								if (!w || !h) return null;
								const c = document.createElement('canvas');
								c.width = w;
								c.height = h;
								const cx = c.getContext('2d');
								cx.drawImage(img, 0, 0, w, h);
								const data = cx.getImageData(0, 0, w, h).data;
								let count = 0;
								let sumX = 0;
								let sumY = 0;
								for (let y = 0; y < h; y++) {
									for (let x = 0; x < w; x++) {
										const i = (y * w + x) * 4;
										const r = data[i];
										const g = data[i + 1];
										const b = data[i + 2];
										const a = data[i + 3];
										// red-ish pixel threshold (tuned)
										if (a > 64 && r > 200 && g < 120 && b < 120) {
											sumX += x;
											sumY += y;
											count += 1;
										}
									}
								}
								if (count === 0) return null;
								return { x: sumX / count, y: sumY / count };
							} catch (e) {
								return null;
							}
						};

						const positionDot = () => {
							// Ensure image is present and has natural size
							if (!viewerImageNode || !viewerImageNode.naturalWidth || !viewerImageNode.naturalHeight) {
								viewerDotNode.style.display = 'none';
								return;
							}

							// Try to find a red pixel drawn on the image itself (user-drawn marker)
							if (!viewerDotNode._detectedSrcXY) {
								const found = findRedPixelInImage(viewerImageNode);
								if (found) {
									viewerDotNode._detectedSrcXY = found; // {x,y} in image pixels
								}
							}

							const imgW = viewerImageNode.naturalWidth;
							const imgH = viewerImageNode.naturalHeight;
							let srcX, srcY;

							if (viewerDotNode._detectedSrcXY) {
								srcX = viewerDotNode._detectedSrcXY.x;
								srcY = viewerDotNode._detectedSrcXY.y;
							} else {
								// fallback to using marker lat/lon mapping
								const lat = state.markerLatitude;
								const lon = state.markerLongitude;
								const u = (1 - (((lon / (Math.PI * 2)) + 1) % 1)) % 1;
								const v = (0.5 - (lat / Math.PI));
								srcX = u * imgW;
								srcY = v * imgH;
							}

							// displayed (rendered) rect inside the image element (object-fit: contain)
							const rect = viewerImageNode.getBoundingClientRect();
							const scale = Math.min(rect.width / imgW, rect.height / imgH);
							const dispW = imgW * scale;
							const dispH = imgH * scale;
							const offsetX = (rect.width - dispW) * 0.5;
							const offsetY = (rect.height - dispH) * 0.5;

							const dispX = offsetX + (srcX * scale);
							const dispY = offsetY + (srcY * scale);

							const leftPercent = (dispX / rect.width) * 100;
							const topPercent = (dispY / rect.height) * 100;

							viewerDotNode.style.display = 'block';
							viewerDotNode.style.left = `${leftPercent}%`;
							viewerDotNode.style.top = `${topPercent}%`;

							// enable pointer events to allow selection
							viewerDotNode.style.pointerEvents = 'auto';
							viewerDotNode.style.cursor = 'pointer';
						};

						positionDot();
						viewerDotNode._positionHandler = positionDot;
						window.addEventListener('resize', viewerDotNode._positionHandler);

						// image click-to-place handler removed to keep marker fixed
					}
				} else if (viewerFallbackNode) {
					viewerFallbackNode.hidden = false;
				}
			}
		}

		viewerCloseNodes.forEach((node) => {
			node.addEventListener('click', closeViewerPanel);
		});

		if (viewerFullscreenButtonNode && viewerDialogNode && document.fullscreenEnabled) {
			viewerFullscreenButtonNode.addEventListener('click', async () => {
				try {
					if (document.fullscreenElement) {
						await document.exitFullscreen();
					} else {
						await viewerDialogNode.requestFullscreen();
					}
					updateViewerFullscreenButtonLabel();
				} catch (error) {
					console.error(error);
					updateStatus('Le mode plein ecran de la carte n\'est pas disponible.');
				}
			});

			document.addEventListener('fullscreenchange', updateViewerFullscreenButtonLabel);
		} else if (viewerFullscreenButtonNode) {
			viewerFullscreenButtonNode.hidden = true;
		}

		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				closeViewerPanel();
			}
		});

		if (viewerPanelNode) {
			viewerPanelNode.hidden = true;
		}

		window.addEventListener('pageshow', () => {
			if (viewerPanelNode) {
				viewerPanelNode.hidden = true;
			}
		});

		function setLoadingProgress(value) {
			const nextProgress = Math.max(0, Math.min(100, value));
			currentLoadingProgress = nextProgress;

			if (loaderBarNode) {
				loaderBarNode.style.transform = `scaleX(${nextProgress / 100})`;
			}
		}

		function animateLoadingProgress(targetValue, duration) {
			const startValue = currentLoadingProgress;
			const targetProgress = Math.max(startValue, Math.min(100, targetValue));
			const startTime = window.performance.now();

			if (progressAnimationFrameId) {
				window.cancelAnimationFrame(progressAnimationFrameId);
				progressAnimationFrameId = 0;
			}

			return new Promise((resolve) => {
				const tick = (now) => {
					const ratio = duration <= 0 ? 1 : Math.min(1, (now - startTime) / duration);
					setLoadingProgress(startValue + ((targetProgress - startValue) * ratio));

					if (ratio < 1) {
						progressAnimationFrameId = window.requestAnimationFrame(tick);
						return;
					}

					progressAnimationFrameId = 0;
					resolve();
				};

				progressAnimationFrameId = window.requestAnimationFrame(tick);
			});
		}

		function setLoadingState(isLoading) {
			root.classList.toggle('is-loading', isLoading);

			if (!isLoading && progressAnimationFrameId) {
				window.cancelAnimationFrame(progressAnimationFrameId);
				progressAnimationFrameId = 0;
			}
		}

		function setLoaderVisible(isVisible) {
			if (loaderNode) {
				loaderNode.hidden = !isVisible;
			}
		}

		function setAccessState(isAwaitingAccess) {
			root.classList.toggle('is-awaiting-access', isAwaitingAccess);
			if (accessNode) {
				accessNode.hidden = !isAwaitingAccess;
			}
		}

		function setFullscreenButtonVisible(isVisible) {
			if (fullscreenButtonNode) {
				fullscreenButtonNode.hidden = !isVisible;
			}
		}

		function updateFullscreenButtonLabel() {
			if (!fullscreenButtonNode) {
				return;
			}

			const label = document.fullscreenElement === root ? 'Quitter plein ecran' : 'Plein ecran';
			fullscreenButtonNode.setAttribute('aria-label', label);
			fullscreenButtonNode.setAttribute('title', label);
		}

		async function completeLoadingSequence(showAccessButton = true) {
			setLoadingProgress(100);

			setLoadingState(false);
			setLoaderVisible(false);
			setAccessState(showAccessButton);
		}

		if (!canvasHost) {
			return;
		}

		setLoaderVisible(true);
		setLoadingState(true);
		setAccessState(false);
		setFullscreenButtonVisible(false);
		setLoadingProgress(0);
		const firstLoadingStep = animateLoadingProgress(50, firstLoadingStepDuration);

		const canvas = createCanvas(canvasHost);
		const context = canvas.getContext('2d');

		if (!context) {
			await firstLoadingStep;
			await completeLoadingSequence(false);
			updateStatus('Le navigateur n\'a pas pu initialiser le canvas du globe.');
			return;
		}

		let planetTexture;

		try {
			planetTexture = await loadPlanetTexture();
			await firstLoadingStep;
		} catch (error) {
			console.error(error);
			await firstLoadingStep;
			await completeLoadingSequence(false);
			updateStatus('La texture du globe n\'a pas pu être chargée.');
			return;
		}

		const textureBuffer = createTextureBuffer(planetTexture);
		const renderBuffer = createRenderBuffer(getRenderBufferSize(textureBuffer));

		if (!textureBuffer || !renderBuffer) {
			await animateLoadingProgress(100, secondLoadingStepDuration);
			await completeLoadingSequence(false);
			updateStatus('Le navigateur n\'a pas pu préparer la texture 3D du globe.');
			return;
		}

		const stars = createStars(180);
		const nebulaBlobs = createNebulaBlobs();
		await animateLoadingProgress(100, secondLoadingStepDuration);
		const state = {
			yaw: 0.45,
			pitch: -0.22,
			targetYaw: 0.45,
			targetPitch: -0.22,
			zoom: 1,
			dragging: false,
			markerPressed: false,
			pointerMoved: false,
			markerLatitude: 30.62,
			markerLongitude: 160.14,
			pointerId: null,
			startX: 0,
			startY: 0,
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

		let animationFrameId = 0;

		function drawBackground(width, height) {
			context.fillStyle = '#0b1637';
			context.fillRect(0, 0, width, height);

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

			drawAlpsMarker(centerX, centerY, radius);
		}

		function getMarkerProjection(width, height) {
			const centerX = width * 0.5;
			const centerY = height * 0.52;
			const radius = Math.min(width, height) * 0.31 * state.zoom;
			const markerPoint = createPointFromCoordinates(state.markerLatitude, state.markerLongitude);
			const rotatedMarker = rotatePoint(markerPoint, state.yaw, state.pitch);

			if (rotatedMarker.z <= 0) {
				return null;
			}

			return {
				centerX,
				centerY,
				radius,
				markerPoint,
				rotatedMarker,
				projectedMarker: projectPoint(rotatedMarker, radius, centerX, centerY)
			};
		}

		function drawAlpsMarker(centerX, centerY, radius) {
			const markerPoint = createPointFromCoordinates(state.markerLatitude, state.markerLongitude);
			const rotatedMarker = rotatePoint(markerPoint, state.yaw, state.pitch);

			if (rotatedMarker.z <= 0) {
				return;
			}

			const projectedMarker = projectPoint(rotatedMarker, radius, centerX, centerY);
			const pulse = (Math.sin(window.performance.now() * 0.008) + 1) * 0.5;
			const outerRadius = radius * (0.03 + (pulse * 0.012));
			const innerRadius = radius * 0.014;

			context.save();
			context.globalAlpha = 0.28 + (pulse * 0.34);
			context.fillStyle = '#ef2e3a';
			context.beginPath();
			context.arc(projectedMarker.x, projectedMarker.y, outerRadius, 0, Math.PI * 2);
			context.fill();

			context.globalAlpha = 1;
			context.fillStyle = '#ef2e3a';
			context.beginPath();
			context.arc(projectedMarker.x, projectedMarker.y, innerRadius, 0, Math.PI * 2);
			context.fill();

			context.lineWidth = 1.4;
			context.strokeStyle = 'rgba(255, 255, 255, 0.92)';
			context.beginPath();
			context.arc(projectedMarker.x, projectedMarker.y, innerRadius + (radius * 0.004), 0, Math.PI * 2);
			context.stroke();
			context.restore();
		}

		function updateMarkerFromPointer(event) {
			const bounds = canvas.getBoundingClientRect();
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;
			const centerX = width * 0.5;
			const centerY = height * 0.52;
			const radius = Math.min(width, height) * 0.31 * state.zoom;
			const localX = event.clientX - bounds.left;
			const localY = event.clientY - bounds.top;
			const normalizedX = (localX - centerX) / radius;
			const normalizedY = (centerY - localY) / radius;
			const distanceSquared = (normalizedX * normalizedX) + (normalizedY * normalizedY);

			if (distanceSquared > 1) {
				return false;
			}

			const visiblePoint = {
				x: normalizedX,
				y: normalizedY,
				z: Math.sqrt(1 - distanceSquared)
			};
			const globePoint = inverseRotatePoint(visiblePoint, state.yaw, state.pitch);
			const coordinates = createCoordinatesFromPoint(globePoint);

			state.markerLatitude = coordinates.latitude;
			state.markerLongitude = coordinates.longitude;
			updateStatus(`Point: ${coordinates.latitude.toFixed(2)}, ${coordinates.longitude.toFixed(2)}`);
			return true;
		}

		canvas.addEventListener('pointerdown', (event) => {
			if (isViewerOpen()) {
				return;
			}

			const markerProjection = getMarkerProjection(canvas.clientWidth, canvas.clientHeight);
			const hitRadius = markerProjection ? Math.max(14, markerProjection.radius * 0.05) : 0;
			const pointerX = event.clientX - canvas.getBoundingClientRect().left;
			const pointerY = event.clientY - canvas.getBoundingClientRect().top;
			const markerHit = markerProjection && Math.hypot(pointerX - markerProjection.projectedMarker.x, pointerY - markerProjection.projectedMarker.y) <= hitRadius;

			state.dragging = !markerHit;
			state.markerPressed = Boolean(markerHit);
			state.pointerMoved = false;
			state.pointerId = event.pointerId;
			state.startX = event.clientX;
			state.startY = event.clientY;
			state.lastX = event.clientX;
			state.lastY = event.clientY;
			canvas.setPointerCapture(event.pointerId);
		});

		canvas.addEventListener('pointermove', (event) => {
			if (state.pointerId !== event.pointerId) {
				return;
			}

			if (state.markerPressed) {
				const movedDistance = Math.hypot(event.clientX - state.startX, event.clientY - state.startY);

				if (movedDistance > 6) {
					state.pointerMoved = true;
				}

				return;
			}

			if (!state.dragging) {
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

			if (event.type === 'pointerup' && state.markerPressed && !state.pointerMoved) {
				openViewerPanel(franceView);
			}

			state.dragging = false;
			state.markerPressed = false;
			state.pointerMoved = false;
			canvas.releasePointerCapture(event.pointerId);
			state.pointerId = null;
		}

		canvas.addEventListener('pointerup', releasePointer);
		canvas.addEventListener('pointercancel', releasePointer);
		canvas.addEventListener('pointerleave', releasePointer);

		canvas.addEventListener('wheel', (event) => {
			if (isViewerOpen()) {
				return;
			}

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

		drawBackground(canvas.clientWidth, canvas.clientHeight);
		drawGlobe(canvas.clientWidth, canvas.clientHeight);
		await completeLoadingSequence();

		const revealMap = () => {
			setAccessState(false);
			setLoaderVisible(false);
			setFullscreenButtonVisible(Boolean(document.fullscreenEnabled && fullscreenButtonNode));
			updateFullscreenButtonLabel();
			animate();
		};

		if (fullscreenButtonNode && document.fullscreenEnabled) {
			fullscreenButtonNode.addEventListener('click', async () => {
				try {
					if (document.fullscreenElement === root) {
						await document.exitFullscreen();
					} else {
						await root.requestFullscreen();
					}
					updateFullscreenButtonLabel();
				} catch (error) {
					console.error(error);
					updateStatus('Le mode plein ecran n\'est pas disponible.');
				}
			});

			document.addEventListener('fullscreenchange', updateFullscreenButtonLabel);
		} else {
			setFullscreenButtonVisible(false);
		}

		if (accessButtonNode) {
			accessButtonNode.addEventListener('click', revealMap, { once: true });
			accessButtonNode.focus();
		} else {
			revealMap();
		}

		window.addEventListener('beforeunload', () => {
			window.cancelAnimationFrame(animationFrameId);
			resizeObserver.disconnect();
		}, { once: true });
	}

	document.addEventListener('DOMContentLoaded', initGlobe);
})();
