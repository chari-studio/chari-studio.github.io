/* CHARI STUDIO site behaviour: audio players, slideshows, lightbox, home backdrop */
(function () {
	'use strict';

	/* ---------- Audio players ---------- */
	var PLAY = '<svg viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0 L10 6 L0 12 Z"/></svg>';
	var PAUSE = '<svg viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0 H3.5 V12 H0 Z M6.5 0 H10 V12 H6.5 Z"/></svg>';
	var players = [];

	document.querySelectorAll('[data-audio]').forEach(function (el) {
		var audio = new Audio();
		audio.preload = 'none';
		audio.src = el.getAttribute('data-audio');
		var label = el.getAttribute('data-label') || '';
		el.classList.add('player');
		el.innerHTML =
			'<button class="btn" type="button" aria-label="Play ' + label + '">' + PLAY + '</button>' +
			'<div class="track"><div class="buffer"></div><div class="progress"></div><div class="lbl"></div></div>';
		el.querySelector('.lbl').textContent = label;
		var btn = el.querySelector('.btn');
		var track = el.querySelector('.track');
		var prog = el.querySelector('.progress');
		var buf = el.querySelector('.buffer');
		players.push(audio);

		btn.addEventListener('click', function () {
			if (audio.paused) {
				players.forEach(function (a) { if (a !== audio) a.pause(); });
				audio.play();
			} else {
				audio.pause();
			}
		});
		audio.addEventListener('play', function () { btn.innerHTML = PAUSE; btn.setAttribute('aria-label', 'Pause ' + label); });
		audio.addEventListener('pause', function () { btn.innerHTML = PLAY; btn.setAttribute('aria-label', 'Play ' + label); });
		audio.addEventListener('timeupdate', function () {
			if (audio.duration) prog.style.width = (audio.currentTime / audio.duration * 100) + '%';
		});
		audio.addEventListener('progress', function () {
			if (audio.duration && audio.buffered.length) {
				buf.style.width = (audio.buffered.end(audio.buffered.length - 1) / audio.duration * 100) + '%';
			}
		});
		track.addEventListener('click', function (e) {
			var r = track.getBoundingClientRect();
			var ratio = (e.clientX - r.left) / r.width;
			var seek = function () { audio.currentTime = ratio * audio.duration; };
			if (audio.duration) seek();
			else { audio.addEventListener('loadedmetadata', seek, { once: true }); audio.load(); }
			if (audio.paused) btn.click();
		});
	});

	/* ---------- Slideshows ---------- */
	document.querySelectorAll('.slideshow').forEach(function (ss) {
		var slides = ss.querySelectorAll('.slide');
		var i = 0;
		if (!slides.length) return;
		slides[0].classList.add('on');
		function go(d) {
			slides[i].classList.remove('on');
			i = (i + d + slides.length) % slides.length;
			slides[i].classList.add('on');
		}
		['prev', 'next'].forEach(function (dir) {
			var z = document.createElement('div');
			z.className = 'zone ' + dir;
			z.addEventListener('click', function () { go(dir === 'next' ? 1 : -1); });
			ss.appendChild(z);
			var b = document.createElement('button');
			b.className = 'nav ' + dir;
			b.type = 'button';
			b.setAttribute('aria-label', dir === 'next' ? 'Next image' : 'Previous image');
			b.textContent = dir === 'next' ? '›' : '‹';
			b.addEventListener('click', function () { go(dir === 'next' ? 1 : -1); });
			ss.appendChild(b);
		});
	});

	/* ---------- Lightbox for zoomable images ---------- */
	var zoomables = Array.prototype.slice.call(document.querySelectorAll('img.zoomable'));
	if (zoomables.length) {
		var lb = document.createElement('div');
		lb.className = 'lightbox';
		lb.innerHTML = '<img alt=""><button class="close" type="button" aria-label="Close">×</button>' +
			'<button class="lb-nav lb-prev" type="button" aria-label="Previous">‹</button>' +
			'<button class="lb-nav lb-next" type="button" aria-label="Next">›</button>';
		document.body.appendChild(lb);
		var big = lb.querySelector('img');
		var cur = 0;
		function show(n) {
			cur = (n + zoomables.length) % zoomables.length;
			big.src = zoomables[cur].currentSrc || zoomables[cur].src;
			big.alt = zoomables[cur].alt;
		}
		zoomables.forEach(function (img, n) {
			img.addEventListener('click', function () { show(n); lb.classList.add('open'); });
		});
		lb.addEventListener('click', function (e) {
			if (e.target.classList.contains('lb-prev')) { show(cur - 1); return; }
			if (e.target.classList.contains('lb-next')) { show(cur + 1); return; }
			lb.classList.remove('open');
		});
		document.addEventListener('keydown', function (e) {
			if (!lb.classList.contains('open')) return;
			if (e.key === 'Escape') lb.classList.remove('open');
			if (e.key === 'ArrowLeft') show(cur - 1);
			if (e.key === 'ArrowRight') show(cur + 1);
		});
	}

	/* ---------- Home: pixelation backdrop ---------- */
	var canvas = document.getElementById('backdrop');
	if (canvas) {
		var ctx = canvas.getContext('2d');
		var img = new Image();
		var small = document.createElement('canvas');
		var sctx = small.getContext('2d');
		var mouseX = 0.5, block = 30, target = 30;
		img.src = canvas.getAttribute('data-src');

		function draw() {
			var dpr = Math.min(window.devicePixelRatio || 1, 2);
			var W = window.innerWidth, H = window.innerHeight;
			if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
				canvas.width = W * dpr; canvas.height = H * dpr;
			}
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.fillStyle = '#4a4a4a';
			ctx.fillRect(0, 0, W, H);

			var b = Math.max(4, Math.round(block));
			var cols = Math.ceil(W / b), rows = Math.ceil(H / b);

			// faint background grid noise, like Cargo's backdrop texture
			for (var y = 0; y < rows; y++) {
				for (var x = 0; x < cols; x++) {
					var n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
					n = n - Math.floor(n);
					ctx.fillStyle = 'rgba(255,255,255,' + (n * 0.035).toFixed(3) + ')';
					ctx.fillRect(x * b, y * b, b, b);
				}
			}

			if (img.complete && img.naturalWidth) {
				// fit image to viewport height, centred
				var h = H * 1.02, w = h * img.naturalWidth / img.naturalHeight;
				if (w > W) { w = W; h = w * img.naturalHeight / img.naturalWidth; }
				var ox = Math.round((W - w) / 2 / b) * b, oy = Math.round((H - h) / 2 / b) * b;
				var sw = Math.max(1, Math.round(w / b)), sh = Math.max(1, Math.round(h / b));
				small.width = sw; small.height = sh;
				sctx.clearRect(0, 0, sw, sh);
				sctx.drawImage(img, 0, 0, sw, sh);
				ctx.imageSmoothingEnabled = false;
				ctx.drawImage(small, 0, 0, sw, sh, ox, oy, sw * b, sh * b);
			}
		}

		function loop() {
			block += (target - block) * 0.08;
			draw();
			if (Math.abs(target - block) > 0.05) requestAnimationFrame(loop);
			else { block = target; draw(); running = false; }
		}
		var running = false;
		function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }

		window.addEventListener('mousemove', function (e) {
			mouseX = e.clientX / window.innerWidth;
			// pixel size eases between coarse and fine as the cursor moves
			target = 18 + Math.abs(mouseX - 0.5) * 2 * 24;
			kick();
		});
		window.addEventListener('resize', draw);
		img.onload = draw;
		draw();
	}
})();
