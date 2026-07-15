document.documentElement.classList.add("js-enabled");

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const animatedPaperTitle = document.querySelector("[data-paper-title]");
const animatedPaperTitleText = animatedPaperTitle?.querySelector("[data-paper-title-type]");

if (animatedPaperTitle && animatedPaperTitleText) {
  const fullTitleText = animatedPaperTitleText.getAttribute("data-text") || "";
  const finishPaperTitle = () => {
    animatedPaperTitleText.textContent = fullTitleText;
    animatedPaperTitle.classList.add("is-typing-complete");
    animatedPaperTitle.closest(".paper-title-block")?.classList.add("is-title-sequence-complete");
  };

  if (reducedMotionQuery.matches) {
    finishPaperTitle();
  } else {
    animatedPaperTitleText.textContent = "";
    let titleCharacterIndex = 0;

    const typePaperTitleCharacter = () => {
      titleCharacterIndex += 1;
      animatedPaperTitleText.textContent = fullTitleText.slice(0, titleCharacterIndex);

      if (titleCharacterIndex < fullTitleText.length) {
        const characterDelay = fullTitleText[titleCharacterIndex - 1] === " " ? 110 : 72;
        window.setTimeout(typePaperTitleCharacter, characterDelay);
      } else {
        window.setTimeout(finishPaperTitle, 180);
      }
    };

    window.setTimeout(typePaperTitleCharacter, 360);
  }
}

document.querySelectorAll("[data-study-system-carousel]").forEach((carousel) => {
  const slides = Array.from(carousel.querySelectorAll("[data-study-system-slide]"));
  const viewport = carousel.querySelector("[data-study-system-viewport]");
  const track = carousel.querySelector(".study-system-grid");
  const previousButton = carousel.querySelector("[data-study-carousel-prev]");
  const nextButton = carousel.querySelector("[data-study-carousel-next]");
  const dots = Array.from(carousel.querySelectorAll("[data-study-carousel-dot]"));
  let activeIndex = 0;
  let pointerStartX = null;
  let pointerStartTime = 0;
  let dragStartTrackX = 0;
  let currentTrackX = 0;
  let isDragging = false;
  let suppressClick = false;

  const setTrackPosition = (nextTrackX) => {
    if (!track) return;
    currentTrackX = nextTrackX;
    track.style.transform = `translate3d(${nextTrackX}px, 0, 0)`;
  };

  const positionTrack = (animate = true) => {
    if (!viewport || !track || !slides[activeIndex]) return;

    if (!animate) track.classList.add("is-immediate");

    const activeSlide = slides[activeIndex];
    const centeredOffset = activeSlide.offsetLeft - (viewport.clientWidth - activeSlide.offsetWidth) / 2;
    setTrackPosition(-centeredOffset);

    if (!animate) {
      window.requestAnimationFrame(() => track.classList.remove("is-immediate"));
    }
  };

  const showSlide = (nextIndex, animate = true) => {
    activeIndex = Math.min(slides.length - 1, Math.max(0, nextIndex));

    slides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === activeIndex);
      slide.classList.toggle("is-before", index < activeIndex);
      slide.setAttribute("aria-hidden", String(index !== activeIndex));
    });

    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle("is-active", isActive);
      if (isActive) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });

    if (previousButton) previousButton.disabled = activeIndex === 0;
    if (nextButton) nextButton.disabled = activeIndex === slides.length - 1;

    window.requestAnimationFrame(() => positionTrack(animate));
  };

  previousButton?.addEventListener("click", () => showSlide(activeIndex - 1));
  nextButton?.addEventListener("click", () => showSlide(activeIndex + 1));
  dots.forEach((dot) => {
    dot.addEventListener("click", () => showSlide(Number(dot.getAttribute("data-study-carousel-dot"))));
  });

  viewport?.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) return;
    if (
      event.target instanceof Element &&
      event.target.closest("button, input, textarea, select, a, label, [contenteditable='true']")
    ) {
      return;
    }
    pointerStartX = event.clientX;
    pointerStartTime = performance.now();
    dragStartTrackX = currentTrackX;
    isDragging = false;
  });

  viewport?.addEventListener("pointermove", (event) => {
    if (pointerStartX === null || !event.isPrimary) return;
    const distance = event.clientX - pointerStartX;

    if (!isDragging && Math.abs(distance) < 5) return;

    isDragging = true;
    if (!viewport.hasPointerCapture?.(event.pointerId)) {
      viewport.setPointerCapture?.(event.pointerId);
    }
    track?.classList.add("is-dragging");
    viewport.classList.add("is-dragging");

    const isPullingPastFirst = activeIndex === 0 && distance > 0;
    const isPullingPastLast = activeIndex === slides.length - 1 && distance < 0;
    const resistedDistance = isPullingPastFirst || isPullingPastLast ? distance * 0.34 : distance;
    setTrackPosition(dragStartTrackX + resistedDistance);
    event.preventDefault();
  });

  const finishPointerDrag = (event, cancelled = false) => {
    if (pointerStartX === null || !event.isPrimary) return;

    const distance = event.clientX - pointerStartX;
    const elapsed = Math.max(1, performance.now() - pointerStartTime);
    const velocity = distance / elapsed;
    const completedDrag = isDragging;

    pointerStartX = null;
    isDragging = false;
    track?.classList.remove("is-dragging");
    viewport.classList.remove("is-dragging");

    if (viewport.hasPointerCapture?.(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    if (!completedDrag) return;

    suppressClick = true;
    window.setTimeout(() => {
      suppressClick = false;
    }, 0);

    if (cancelled) {
      positionTrack(true);
      return;
    }

    const distanceThreshold = Math.min(76, viewport.clientWidth * 0.14);
    const shouldAdvance = Math.abs(distance) >= distanceThreshold || Math.abs(velocity) > 0.48;

    if (shouldAdvance) {
      showSlide(distance < 0 ? activeIndex + 1 : activeIndex - 1);
    } else {
      positionTrack(true);
    }
  };

  viewport?.addEventListener("pointerup", (event) => finishPointerDrag(event));

  viewport?.addEventListener("pointercancel", (event) => finishPointerDrag(event, true));

  viewport?.addEventListener(
    "click",
    (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );

  viewport?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showSlide(activeIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showSlide(activeIndex + 1);
    }
  });

  if (viewport && "ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => positionTrack(false));
    resizeObserver.observe(viewport);
  } else {
    window.addEventListener("resize", () => positionTrack(false));
  }

  document.fonts?.ready.then(() => positionTrack(false));
  showSlide(0, false);
});

const purpleMessageTimers = new WeakMap();
const purpleMessages = [
  { text: "You're watching HCI lectures! Keep going.", offTask: false },
  { text: "I see you're chatting about pizza. Maybe focus on HCI study topics?", offTask: true },
  { text: "Looks like a good lecture!", offTask: false },
];

const stopPurpleMessages = (appWindow) => {
  const timer = purpleMessageTimers.get(appWindow);
  if (timer) window.clearInterval(timer);
  purpleMessageTimers.delete(appWindow);
};

const startPurpleMessages = (appWindow) => {
  const message = appWindow.querySelector("[data-purple-message]");
  if (!message) return;

  stopPurpleMessages(appWindow);
  let messageIndex = 0;

  const renderMessage = () => {
    const state = purpleMessages[messageIndex];
    message.textContent = state.text;
    message.classList.toggle("is-off-task", state.offTask);
    message.classList.toggle("is-on-task", !state.offTask);
    messageIndex = (messageIndex + 1) % purpleMessages.length;
  };

  renderMessage();
  purpleMessageTimers.set(appWindow, window.setInterval(renderMessage, 2600));
};

const resetInteractiveStudyApp = (appWindow) => {
  stopPurpleMessages(appWindow);
  appWindow.classList.remove("is-running", "is-clarifying", "is-monitoring", "is-survey");

  const toggle = appWindow.querySelector("[data-simple-reminder-toggle], [data-purple-toggle]");
  if (toggle) {
    toggle.disabled = false;
    toggle.classList.remove("is-running");
    toggle.textContent = "Start";
    toggle.setAttribute("aria-pressed", "false");
  }

  appWindow.querySelectorAll('.study-alignment-survey input[type="radio"]').forEach((input) => {
    input.checked = false;
  });

  const purpleResponse = appWindow.querySelector("[data-purple-response]");
  const purpleSend = appWindow.querySelector("[data-purple-send]");
  const purpleUserResponse = appWindow.querySelector("[data-purple-user-response]");
  const purpleReadyMessage = appWindow.querySelector("[data-purple-ready-message]");
  if (purpleResponse) {
    purpleResponse.disabled = false;
    purpleResponse.value = "";
  }
  if (purpleSend) purpleSend.disabled = false;
  if (purpleUserResponse) {
    purpleUserResponse.hidden = true;
    purpleUserResponse.textContent = "";
  }
  if (purpleReadyMessage) purpleReadyMessage.hidden = true;
  appWindow.classList.remove("is-ready");
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const rangeProgress = (progress, start, end) => {
  const value = clamp01((progress - start) / Math.max(0.0001, end - start));
  return value * value * (3 - 2 * value);
};
const getScrollProgress = (section) => {
  const rect = section.getBoundingClientRect();
  const scrollable = Math.max(1, rect.height - window.innerHeight);
  return clamp01(-rect.top / scrollable);
};
const setVideoProgress = (video, progress) => {
  if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
  const targetTime = clamp01(progress) * Math.max(0, video.duration - 0.05);
  if (Math.abs(video.currentTime - targetTime) < 0.035) return;
  try {
    video.currentTime = targetTime;
  } catch {
    // Metadata can arrive one frame after the scroll scene becomes visible.
  }
};

const inViewAutoplayVideos = Array.from(
  document.querySelectorAll("video[data-autoplay-in-view]"),
);

if ("IntersectionObserver" in window && inViewAutoplayVideos.length) {
  const autoplayObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting && !reducedMotionQuery.matches) {
          const playPromise = video.play();
          if (playPromise?.catch) playPromise.catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { rootMargin: "18% 0px", threshold: 0.12 },
  );

  inViewAutoplayVideos.forEach((video) => autoplayObserver.observe(video));
  reducedMotionQuery.addEventListener?.("change", () => {
    if (!reducedMotionQuery.matches) return;
    inViewAutoplayVideos.forEach((video) => video.pause());
  });
}

const animatedElements = Array.from(document.querySelectorAll("[data-animate]"));

if ("IntersectionObserver" in window && animatedElements.length) {
  const animationObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        animationObserver.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.18,
    },
  );

  animatedElements.forEach((element) => animationObserver.observe(element));
} else {
  animatedElements.forEach((element) => element.classList.add("is-visible"));
}

const formatAnimatedCount = (value, decimals, suffix) => {
  const formattedValue = Number(value).toFixed(decimals);
  return suffix ? `${formattedValue}<em>${suffix}</em>` : formattedValue;
};

const animateResultCounters = (scope) => {
  const counters = Array.from(scope.querySelectorAll("[data-result-count]"));
  if (!counters.length) return;

  counters.forEach((counter) => {
    const start = Number(counter.getAttribute("data-result-count-start") || "0");
    const end = Number(counter.getAttribute("data-result-count-end") || counter.textContent || "0");
    const decimals = Number(counter.getAttribute("data-result-count-decimals") || "0");
    const suffix = counter.getAttribute("data-result-count-suffix") || "";
    const delay = Number(counter.getAttribute("data-result-count-delay") || "0");
    const duration = Number(counter.getAttribute("data-result-count-duration") || "1200");

    window.clearTimeout(Number(counter.dataset.resultCountTimer || "0"));
    counter.innerHTML = formatAnimatedCount(start, decimals, suffix);

    if (reducedMotionQuery.matches) {
      counter.innerHTML = formatAnimatedCount(end, decimals, suffix);
      return;
    }

    const timer = window.setTimeout(() => {
      const startTime = performance.now();

      const tick = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = start + (end - start) * easedProgress;
        counter.innerHTML = formatAnimatedCount(currentValue, decimals, suffix);

        if (progress < 1) {
          window.requestAnimationFrame(tick);
        } else {
          counter.innerHTML = formatAnimatedCount(end, decimals, suffix);
        }
      };

      window.requestAnimationFrame(tick);
    }, delay);

    counter.dataset.resultCountTimer = String(timer);
  });
};

document.querySelectorAll(".result-finding-sequence").forEach((sequence) => {
  const steps = Array.from(sequence.querySelectorAll(":scope > .result-finding-step"));
  const panels = steps.map((step) => step.querySelector(".result-finding-slide")).filter(Boolean);

  if (!panels.length) return;

  const questionCard = sequence.closest(".result-question-card");
  const resultSection = sequence.closest(".result-section");
  const questionHeader = questionCard?.querySelector(":scope > .result-question-header");
  const resultTitle = resultSection?.querySelector(".section-heading .result-title");
  const isPrimaryResultSequence = questionCard?.classList.contains("result-focus-card");
  const stickyStage = document.createElement("div");
  stickyStage.className = "result-finding-sticky";

  const toplines = panels.map((panel) => panel.querySelector(":scope > .result-slide-topline"));
  const titles = toplines.map((topline) => {
    const heading = topline?.querySelector("h4");
    return (heading?.textContent || "").replace(/^Findings:\s*/i, "").trim();
  });
  const commonButton = toplines.find(Boolean)?.querySelector("[data-detail-toggle]")?.cloneNode(true);
  const fixedTopline = document.createElement("div");
  fixedTopline.className = "result-slide-topline result-finding-fixed-topline";

  const fixedHeading = document.createElement("h4");
  const fixedLabel = document.createElement("strong");
  fixedLabel.textContent = "Findings:";
  const titleStack = document.createElement("span");
  titleStack.className = "result-finding-title-stack";

  titles.forEach((title, index) => {
    const titleItem = document.createElement("span");
    titleItem.textContent = title;
    titleItem.classList.toggle("is-active", index === 0);
    titleStack.append(titleItem);
  });

  fixedHeading.append(fixedLabel, document.createTextNode(" "), titleStack);
  fixedTopline.append(fixedHeading);

  const panelStack = document.createElement("div");
  panelStack.className = "result-finding-panel-stack";

  const stickyContext = document.createElement("div");
  stickyContext.className = "result-sticky-context";
  const typingTargets = [];

  if (isPrimaryResultSequence && resultTitle) {
    const stickyTitle = resultTitle.cloneNode(true);
    stickyTitle.classList.add("result-sticky-title");
    stickyContext.append(stickyTitle);
    resultSection?.classList.add("is-results-scrolly");
  }

  if (questionHeader) {
    const stickyQuestion = questionHeader.cloneNode(true);
    stickyQuestion.classList.add("result-sticky-question");
    if (isPrimaryResultSequence) {
      stickyQuestion.classList.add("result-sticky-question-typing");
      const questionLabel = stickyQuestion.querySelector("span");
      const questionText = stickyQuestion.querySelector("h3");

      if (questionLabel && questionText) {
        typingTargets.push({
          element: questionLabel,
          speed: 120,
          text: questionLabel.textContent.trim(),
        });
        typingTargets.push({
          element: questionText,
          speed: 32,
          text: questionText.textContent.trim(),
        });
        questionLabel.textContent = "";
        questionText.textContent = "";
      }
    }
    stickyContext.append(stickyQuestion);
    questionCard?.classList.add("is-scrolly-enhanced");
  }

  const scrollTrack = document.createElement("div");
  scrollTrack.className = "result-finding-scroll-track";
  scrollTrack.setAttribute("aria-hidden", "true");

  const detailFooter = document.createElement("div");
  detailFooter.className = "result-finding-detail-footer";
  if (commonButton) detailFooter.append(commonButton);

  panels.forEach((panel, index) => {
    toplines[index]?.remove();
    panel.classList.toggle("is-active", index === 0);
    panel.setAttribute("aria-hidden", String(index !== 0));
    panelStack.append(panel);

    const marker = document.createElement("span");
    marker.className = "result-finding-scroll-marker";
    scrollTrack.append(marker);
  });

  if (stickyContext.children.length) stickyStage.append(stickyContext);
  stickyStage.append(fixedTopline, panelStack);
  sequence.replaceChildren(stickyStage, scrollTrack);
  if (detailFooter.children.length) sequence.append(detailFooter);
  sequence.classList.add("is-fade-sequence");
  if (typingTargets.length) sequence.classList.add("is-awaiting-result-intro");
  sequence.style.setProperty("--finding-count", String(panels.length));
  sequence.style.setProperty("--finding-track-height", `${Math.max(0, panels.length - 1) * 82}svh`);
  const titleItems = Array.from(titleStack.querySelectorAll("span"));

  let activeIndex = 0;
  let isQueued = false;

  const setActivePanel = (nextIndex) => {
    const clampedIndex = Math.max(0, Math.min(panels.length - 1, nextIndex));
    if (clampedIndex === activeIndex) return;

    activeIndex = clampedIndex;
    panels.forEach((panel, index) => {
      const isActive = index === activeIndex;
      panel.classList.toggle("is-active", isActive);
      panel.setAttribute("aria-hidden", String(!isActive));
      titleItems[index]?.classList.toggle("is-active", isActive);
    });
    animateResultCounters(panels[activeIndex]);
  };

  const updateActivePanel = () => {
    const rect = sequence.getBoundingClientRect();
    const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight);
    const travelDistance = Math.max(1, rect.height - viewportHeight);
    const rawProgress = Math.min(1, Math.max(0, -rect.top / travelDistance));
    const nextIndex = Math.min(panels.length - 1, Math.floor(rawProgress * panels.length));
    setActivePanel(nextIndex);
    isQueued = false;
  };

  const queueUpdate = () => {
    if (isQueued) return;
    isQueued = true;
    window.requestAnimationFrame(updateActivePanel);
  };

  window.addEventListener("scroll", queueUpdate, { passive: true });
  window.addEventListener("resize", queueUpdate);
  updateActivePanel();

  if (typingTargets.length) {
    let hasStartedIntro = false;

    const wait = (delay) => new Promise((resolve) => window.setTimeout(resolve, delay));
    const typeText = (target) =>
      new Promise((resolve) => {
        target.element.textContent = "";
        target.element.classList.add("is-typing");

        if (reducedMotionQuery.matches) {
          target.element.textContent = target.text;
          target.element.classList.remove("is-typing");
          resolve();
          return;
        }

        let characterIndex = 0;
        const writeNextCharacter = () => {
          characterIndex += 1;
          target.element.textContent = target.text.slice(0, characterIndex);

          if (characterIndex < target.text.length) {
            window.setTimeout(writeNextCharacter, target.speed);
          } else {
            target.element.classList.remove("is-typing");
            resolve();
          }
        };

        writeNextCharacter();
      });

    const runIntro = async () => {
      if (hasStartedIntro) return;
      hasStartedIntro = true;
      sequence.classList.add("is-result-intro-running");

      for (const target of typingTargets) {
        await typeText(target);
        await wait(target.element.tagName.toLowerCase() === "span" ? 160 : 260);
      }

      sequence.classList.remove("is-awaiting-result-intro");
      sequence.classList.add("is-result-intro-complete");
    };

    if ("IntersectionObserver" in window) {
      const introObserver = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          introObserver.disconnect();
          runIntro();
        },
        { rootMargin: "0px 0px -18% 0px", threshold: 0.08 },
      );
      introObserver.observe(stickyStage);
    } else {
      runIntro();
    }
  }
});

const motivationScrollSections = Array.from(
  document.querySelectorAll("[data-motivation-scroll]"),
);

motivationScrollSections.forEach((section) => {
  const images = Array.from(section.querySelectorAll("[data-motivation-image]"));
  const additions = Array.from(section.querySelectorAll("[data-motivation-addition]"));
  if (!images.length) return;

  let isQueued = false;

  const update = () => {
    const progress = getScrollProgress(section);
    const detailProgress = rangeProgress(progress, 0.46, 0.64);
    section.style.setProperty("--motivation-detail-progress", detailProgress.toFixed(4));

    images.forEach((image, index) => {
      const opacity = index === 0 ? 1 - detailProgress : detailProgress;
      image.style.opacity = opacity.toFixed(4);
      image.style.transform = `scale(${(0.985 + opacity * 0.015).toFixed(4)})`;
      image.setAttribute("aria-hidden", String(opacity < 0.02));
    });

    additions.forEach((addition) => {
      addition.classList.toggle("is-active", detailProgress > 0.02);
    });
  };

  const queueUpdate = () => {
    if (isQueued) return;
    isQueued = true;
    window.requestAnimationFrame(() => {
      isQueued = false;
      update();
    });
  };

  update();
  window.addEventListener("scroll", queueUpdate, { passive: true });
  window.addEventListener("resize", queueUpdate);
});

const relatedScrollSections = Array.from(document.querySelectorAll("[data-related-scroll]"));

relatedScrollSections.forEach((section) => {
  const images = Array.from(section.querySelectorAll("[data-related-image]"));
  const steps = Array.from(section.querySelectorAll("[data-related-step]"));
  const prefixes = Array.from(section.querySelectorAll("[data-related-prefix]"));
  if (!images.length) return;

  let isQueued = false;

  const update = () => {
    const progress = getScrollProgress(section);
    const fadeWindows = [
      [0.09, 0.17, 0.34, 0.43],
      [0.34, 0.43, 0.61, 0.7],
      [0.61, 0.7, 1, 1],
    ];
    const weights = images.map((image, index) => {
      const [enterStart, enterEnd, exitStart, exitEnd] =
        fadeWindows[index] || [index / images.length, (index + 0.35) / images.length, 1, 1];
      const enter = rangeProgress(progress, enterStart, enterEnd);
      const exit = exitStart === 1 ? 1 : 1 - rangeProgress(progress, exitStart, exitEnd);
      const opacity = enter * exit;
      image.style.opacity = opacity.toFixed(4);
      image.style.transform = `translateY(${((1 - opacity) * 16).toFixed(2)}px) scale(${(
        0.985 + opacity * 0.015
      ).toFixed(4)})`;
      image.setAttribute("aria-hidden", String(opacity < 0.02));
      return opacity;
    });
    const activeIndex = weights.indexOf(Math.max(...weights));
    const revealPoints = [0.13, 0.39, 0.66];

    steps.forEach((step, index) => {
      const isVisible = progress >= (revealPoints[index] ?? index / images.length);
      step.classList.toggle("is-visible", isVisible);
      step.classList.toggle("is-active", isVisible && index === activeIndex);
    });

    prefixes.forEach((prefix, index) => {
      prefix.classList.toggle("is-visible", progress >= (revealPoints[index + 1] ?? 1));
    });
  };

  const queueUpdate = () => {
    if (isQueued) return;
    isQueued = true;
    window.requestAnimationFrame(() => {
      isQueued = false;
      update();
    });
  };

  update();
  window.addEventListener("scroll", queueUpdate, { passive: true });
  window.addEventListener("resize", queueUpdate);
});

const problemScrollSections = Array.from(document.querySelectorAll("[data-problem-scroll]"));

problemScrollSections.forEach((section) => {
  let isQueued = false;

  const update = () => {
    const progress = getScrollProgress(section);
    const blockedProgress = rangeProgress(progress, 0.2, 0.31);
    const formativeProgress = rangeProgress(progress, 0.49, 0.6);
    const contextProgress = rangeProgress(progress, 0.73, 0.82);

    section.style.setProperty("--problem-blocked-progress", blockedProgress.toFixed(4));
    section.style.setProperty("--problem-formative-progress", formativeProgress.toFixed(4));
    section.style.setProperty("--problem-context-progress", contextProgress.toFixed(4));
    section.classList.toggle("is-blocked", blockedProgress > 0.5);
    section.classList.toggle("is-formative", formativeProgress > 0.5);
    section.classList.toggle("is-context-needed", contextProgress > 0.5);
  };

  const queueUpdate = () => {
    if (isQueued) return;
    isQueued = true;
    window.requestAnimationFrame(() => {
      isQueued = false;
      update();
    });
  };

  update();
  window.addEventListener("scroll", queueUpdate, { passive: true });
  window.addEventListener("resize", queueUpdate);
});

const keyIdeaQuestions = Array.from(document.querySelectorAll("[data-key-idea-question]"));

keyIdeaQuestions.forEach((section) => {
  const question = section.querySelector(".key-idea-question");
  const subject = section.querySelector("[data-key-idea-subject]");
  const video = section.querySelector("video");
  if (!question || !subject || !video) return;

  let currentLabel = subject.textContent.trim() || "advisor";
  let targetLabel = currentLabel;
  let switchTimers = [];
  let animationFrame = 0;

  const clearSwitchTimers = () => {
    switchTimers.forEach((timer) => window.clearTimeout(timer));
    switchTimers = [];
  };

  const setLabel = (label) => {
    if (label === targetLabel) return;
    targetLabel = label;
    clearSwitchTimers();
    question.classList.add("is-switching");

    switchTimers.push(window.setTimeout(() => {
      question.classList.toggle("is-ai", label === "AI");
    }, 120));

    switchTimers.push(window.setTimeout(() => {
      subject.textContent = label;
      currentLabel = label;
    }, 360));

    switchTimers.push(window.setTimeout(() => {
      question.classList.remove("is-switching");
    }, 390));
  };

  const syncWithVideo = () => {
    setLabel(video.currentTime < 6 ? "advisor" : "AI");
    animationFrame = window.requestAnimationFrame(syncWithVideo);
  };

  const startSync = () => {
    if (animationFrame) return;
    syncWithVideo();
  };

  const stopSync = () => {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  };

  subject.textContent = currentLabel;
  question.classList.toggle("is-ai", currentLabel === "AI");

  if ("IntersectionObserver" in window) {
    const keyIdeaObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startSync();
          } else {
            stopSync();
          }
        });
      },
      { threshold: 0.38 },
    );

    keyIdeaObserver.observe(section);
  } else {
    startSync();
  }
});

const aiUnderstandingSections = Array.from(document.querySelectorAll("[data-ai-understanding]"));

aiUnderstandingSections.forEach((section) => {
  const row = section.querySelector(".ai-understanding-row");
  const leftVideo = section.querySelector('[data-ai-video="left"]');
  const rightVideo = section.querySelector('[data-ai-video="right"]');
  const videos = [leftVideo, rightVideo].filter(Boolean);
  let cycleTimers = [];
  let isRunning = false;

  const clearCycleTimers = () => {
    cycleTimers.forEach((timer) => window.clearTimeout(timer));
    cycleTimers = [];
  };

  const playVideo = (video) => {
    if (!video) return;
    try {
      video.currentTime = 0;
    } catch {
      // Metadata may not be available on the first in-view frame.
    }
    const playPromise = video.play();
    if (playPromise?.catch) playPromise.catch(() => {});
  };

  const pauseVideo = (video) => {
    if (!video) return;
    video.pause();
    try {
      video.currentTime = 0;
    } catch {
      // Keep the video paused until metadata is available.
    }
  };

  const setPhase = (phase) => {
    row?.classList.toggle("is-left-active", phase === "left");
    row?.classList.toggle("is-right-active", phase === "right");

    if (phase === "left") {
      playVideo(leftVideo);
      pauseVideo(rightVideo);
    } else if (phase === "right") {
      pauseVideo(leftVideo);
      playVideo(rightVideo);
    } else {
      videos.forEach(pauseVideo);
    }
  };

  const scheduleCycle = () => {
    clearCycleTimers();
    setPhase("idle");
    cycleTimers.push(window.setTimeout(() => setPhase("left"), 500));
    cycleTimers.push(window.setTimeout(() => setPhase("right"), 4000));
    cycleTimers.push(window.setTimeout(() => {
      if (isRunning) scheduleCycle();
    }, 8500));
  };

  const startCycle = () => {
    if (isRunning) return;
    isRunning = true;
    scheduleCycle();
  };

  const stopCycle = () => {
    isRunning = false;
    clearCycleTimers();
    setPhase("idle");
  };

  setPhase("idle");

  if ("IntersectionObserver" in window) {
    const aiObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) startCycle();
          else stopCycle();
        });
      },
      { threshold: 0.05 },
    );
    aiObserver.observe(section);
  } else {
    startCycle();
  }
});

const revealElements = Array.from(document.querySelectorAll("[data-reveal]"));

if ("IntersectionObserver" in window && revealElements.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -20% 0px", threshold: 0.28 },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const systemOverviewDetails = {
  overall: {
    title: "Overall System Design",
    copy: "INA connects intention elicitation, screen-context monitoring, user support, and feedback-based refinement.",
  },
  1: {
    title: "1. Intention input",
    copy: "The user has to write their intentions. But, users often input vague intentions.",
  },
  "2-3": {
    title: "2-3. Clarification to user intention",
    copy: "INA asks follow-up questions and turns vague input into a concrete user intention.",
  },
  4: {
    title: "4. Distraction detector",
    copy: "The LLM compares screenshot content, app metadata, and URLs against the desired goal.",
  },
  5: {
    title: "5. User support",
    copy: "INA reinforces aligned activity or sends a gentle nudge when behavior drifts off-task.",
  },
  "6-7": {
    title: "6-7. User feedback and refinement",
    copy: "Users can correct INA when it misunderstands the context, and that feedback helps future decisions better match their intention.",
  },
};

const renderSystemOverviewTitle = (titleElement, titleText) => {
  titleElement.textContent = "";

  const match = titleText.match(/^(\d+(?:-\d+)?)\.\s+(.+)$/);
  if (!match) {
    titleElement.textContent = titleText;
    return;
  }

  const numberGroup = document.createElement("span");
  numberGroup.className = "system-caption-number-group";

  match[1].split("-").forEach((number) => {
    const numberCircle = document.createElement("span");
    numberCircle.className = "system-caption-number";
    numberCircle.textContent = number;
    numberGroup.append(numberCircle);
  });

  const label = document.createElement("span");
  label.className = "system-caption-label";
  label.textContent = match[2];

  titleElement.append(numberGroup, label);
};

const systemOverviews = Array.from(document.querySelectorAll("[data-system-overview]"));
const systemOverviewStepOrder = ["overall", "1", "2-3", "4", "5", "6-7"];

systemOverviews.forEach((overview) => {
  const overallButton = overview.querySelector("[data-system-overview-overall]");
  const buttons = Array.from(overview.querySelectorAll("[data-system-overview-step]"));
  const previousButton = overview.querySelector("[data-system-overview-prev]");
  const nextButton = overview.querySelector("[data-system-overview-next]");
  const regions = Array.from(overview.querySelectorAll("[data-system-overview-region]"));
  const title = overview.querySelector("[data-system-overview-title]");
  const copy = overview.querySelector("[data-system-overview-copy]");
  let currentActiveStep = "overall";

  const applyActiveStep = (activeStep) => {
    const isOverall = activeStep === "overall";
    const details = systemOverviewDetails[activeStep] || systemOverviewDetails.overall;
    const stepIndex = systemOverviewStepOrder.indexOf(activeStep);
    const groupedSteps =
      activeStep === "2-3"
        ? ["2", "3"]
        : activeStep === "6-7"
          ? ["6", "7"]
          : [activeStep];

    currentActiveStep = activeStep;
    overview.setAttribute("data-active-step", activeStep);
    overview.classList.toggle("is-overall", isOverall);
    if (!isOverall) overview.classList.add("has-viewed-details");

    if (overallButton) {
      overallButton.classList.toggle("is-active", isOverall);
      overallButton.setAttribute("aria-pressed", String(isOverall));
    }

    if (previousButton) {
      const isPreviousDisabled = isOverall || stepIndex <= 0;
      previousButton.disabled = isPreviousDisabled;
      previousButton.setAttribute("aria-disabled", String(isPreviousDisabled));
    }

    if (nextButton) {
      const isNextDisabled =
        stepIndex === -1 || stepIndex >= systemOverviewStepOrder.length - 1;
      nextButton.disabled = isNextDisabled;
      nextButton.setAttribute("aria-disabled", String(isNextDisabled));
    }

    buttons.forEach((button) => {
      const buttonStep = button.getAttribute("data-system-overview-step");
      const isActive = !isOverall && groupedSteps.includes(buttonStep);
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    regions.forEach((region) => {
      const regionStep = region.getAttribute("data-system-overview-region");
      region.classList.toggle(
        "is-active",
        !isOverall && groupedSteps.includes(regionStep),
      );
    });

    if (title) renderSystemOverviewTitle(title, details.title);
    if (copy) copy.textContent = details.copy;
  };

  const setActiveStep = (step) => {
    const activeStep =
      step === "2" || step === "3"
        ? "2-3"
        : step === "6" || step === "7"
          ? "6-7"
          : step;
    const isSameStep =
      activeStep === currentActiveStep && overview.hasAttribute("data-active-step");
    if (isSameStep) return;

    applyActiveStep(activeStep);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveStep(button.getAttribute("data-system-overview-step") || "1");
    });
  });

  previousButton?.addEventListener("click", () => {
    const stepIndex = systemOverviewStepOrder.indexOf(currentActiveStep);
    if (stepIndex <= 0) return;
    setActiveStep(systemOverviewStepOrder[stepIndex - 1]);
  });

  nextButton?.addEventListener("click", () => {
    const stepIndex = systemOverviewStepOrder.indexOf(currentActiveStep);
    if (stepIndex === -1 || stepIndex >= systemOverviewStepOrder.length - 1) return;
    setActiveStep(systemOverviewStepOrder[stepIndex + 1]);
  });

  if (overallButton) {
    overallButton.addEventListener("click", () => {
      setActiveStep("overall");
    });
  }

  setActiveStep("overall");
});

const inaDemoSections = Array.from(document.querySelectorAll("[data-ina-demo]"));

const inaDemoSteps = [
  {
    start: 0,
    number: "1",
    text: "The user declares their intention.",
  },
  {
    start: 3,
    number: "2",
    text: "AI monitors the gap between that intention and their actual behavior.",
  },
  {
    start: 8,
    number: "3",
    text: "When a gap opens up, it sends a gentle message.",
  },
  {
    start: 11,
    number: "4",
    text: "When you return from the distraction, it praises you.",
  },
];

inaDemoSections.forEach((section) => {
  const scrollContainer = section.closest(".ina-intro-scroll") || section;
  const video = section.querySelector("[data-ina-demo-video]");
  const caption = section.querySelector("[data-ina-step-caption]");
  const number = section.querySelector("[data-ina-step-number]");
  const text = section.querySelector("[data-ina-step-text]");
  if (!video || !caption || !number || !text) return;

  let activeIndex = -1;
  let switchTimer = 0;
  let isQueued = false;

  const getActiveStepIndex = () => {
    const currentTime = video.currentTime || 0;
    let nextIndex = 0;
    inaDemoSteps.forEach((step, index) => {
      if (currentTime >= step.start) nextIndex = index;
    });
    return nextIndex;
  };

  const renderStep = (index) => {
    if (index === activeIndex) return;
    activeIndex = index;
    const step = inaDemoSteps[index];
    caption.classList.add("is-switching");
    window.clearTimeout(switchTimer);
    switchTimer = window.setTimeout(() => {
      number.textContent = step.number;
      text.textContent = step.text;
      caption.classList.remove("is-switching");
    }, 120);
  };

  const syncStep = () => renderStep(getActiveStepIndex());

  const update = () => {
    const progress = getScrollProgress(scrollContainer);
    const titleProgress = rangeProgress(progress, 0.02, 0.16);
    const videoProgress = rangeProgress(progress, 0.12, 0.92);
    section.style.setProperty("--ina-title-progress", titleProgress.toFixed(4));
    section.classList.toggle("is-demo-playing", progress > 0.1);
    video.pause();
    setVideoProgress(video, videoProgress);
    syncStep();
  };

  const queueUpdate = () => {
    if (isQueued) return;
    isQueued = true;
    window.requestAnimationFrame(() => {
      isQueued = false;
      update();
    });
  };

  video.addEventListener("loadedmetadata", queueUpdate);
  video.addEventListener("seeked", syncStep);
  update();
  window.addEventListener("scroll", queueUpdate, { passive: true });
  window.addEventListener("resize", queueUpdate);
});

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const studySessionToggle = event.target.closest("[data-study-session-toggle]");
  if (studySessionToggle) {
    const isRunning = studySessionToggle.classList.toggle("is-running");
    studySessionToggle.textContent = isRunning ? "Stop" : "Start";
    studySessionToggle.setAttribute("aria-pressed", String(isRunning));
    return;
  }

  const simpleReminderToggle = event.target.closest("[data-simple-reminder-toggle]");
  if (simpleReminderToggle) {
    const appWindow = simpleReminderToggle.closest(".study-app-window");
    if (!appWindow || appWindow.classList.contains("is-survey")) return;

    if (appWindow.classList.contains("is-running")) {
      appWindow.classList.remove("is-running");
      appWindow.classList.add("is-survey");
      simpleReminderToggle.disabled = true;
    } else {
      appWindow.classList.add("is-running");
      simpleReminderToggle.classList.add("is-running");
      simpleReminderToggle.textContent = "Stop";
      simpleReminderToggle.setAttribute("aria-pressed", "true");
    }
    return;
  }

  const purpleToggle = event.target.closest("[data-purple-toggle]");
  if (purpleToggle) {
    const appWindow = purpleToggle.closest(".study-app-purple");
    if (!appWindow || appWindow.classList.contains("is-survey")) return;

    if (appWindow.classList.contains("is-monitoring")) {
      stopPurpleMessages(appWindow);
      appWindow.classList.remove("is-monitoring");
      appWindow.classList.add("is-survey");
      purpleToggle.disabled = true;
      return;
    }

    if (appWindow.classList.contains("is-clarifying") && appWindow.classList.contains("is-ready")) {
      appWindow.classList.remove("is-clarifying", "is-ready");
      appWindow.classList.add("is-monitoring");
      purpleToggle.classList.add("is-running");
      purpleToggle.textContent = "Stop";
      purpleToggle.setAttribute("aria-pressed", "true");
      startPurpleMessages(appWindow);
      return;
    }

    if (!appWindow.classList.contains("is-clarifying")) {
      appWindow.classList.add("is-clarifying");
    }
    return;
  }

  const purpleSend = event.target.closest("[data-purple-send]");
  if (purpleSend) {
    const appWindow = purpleSend.closest(".study-app-purple");
    const responseInput = appWindow?.querySelector("[data-purple-response]");
    const userResponse = appWindow?.querySelector("[data-purple-user-response]");
    const readyMessage = appWindow?.querySelector("[data-purple-ready-message]");
    const response = responseInput?.value.trim() || "";
    if (!appWindow || !responseInput || !userResponse || !readyMessage || !response) return;

    userResponse.textContent = response;
    userResponse.hidden = false;
    readyMessage.hidden = false;
    responseInput.value = "Clarification completed";
    responseInput.disabled = true;
    purpleSend.disabled = true;
    appWindow.classList.add("is-ready");
    return;
  }

  const detailButton = event.target.closest("[data-detail-toggle]");
  if (detailButton) {
    const sourceSelector = detailButton.getAttribute("data-detail-toggle");
    const sources = sourceSelector ? Array.from(document.querySelectorAll(sourceSelector)) : [];
    const modal = document.querySelector("#detail-modal");
    const title = modal?.querySelector("#detail-modal-title");
    const body = modal?.querySelector("[data-detail-modal-body]");

    if (sources.length && modal && title && body) {
      title.textContent = detailButton.getAttribute("data-detail-title") || "Details";
      body.innerHTML = sources.map((source) => source.innerHTML).join("");
      modal.classList.toggle("detail-modal-wide", detailButton.getAttribute("data-detail-variant") === "wide");

      const replayDetailAnimations = () => {
        const animatedFigures = Array.from(
          body.querySelectorAll(".paper-svg-figure, .paper-figure, .bench-table-figure"),
        );

        animatedFigures.forEach((figure) => figure.classList.remove("is-visible"));
        window.requestAnimationFrame(() => {
          animatedFigures.forEach((figure) => {
            figure.getBoundingClientRect();
            figure.classList.add("is-visible");
          });
        });
      };

      if (typeof modal.showModal === "function") {
        modal.showModal();
      } else {
        modal.setAttribute("open", "");
      }

      replayDetailAnimations();
    }

    return;
  }

  const closeDetail = event.target.closest("[data-detail-modal-close]");
  if (closeDetail) {
    const modal = closeDetail.closest("dialog");
    if (modal?.close) {
      modal.close();
    } else {
      modal?.removeAttribute("open");
    }
    return;
  }

  const copyButton = event.target.closest("[data-copy]");
  if (!copyButton) return;

  const selector = copyButton.getAttribute("data-copy");
  const target = selector ? document.querySelector(selector) : null;
  if (!target) return;

  const text = target.textContent || "";

  const markCopied = () => {
    const originalText = copyButton.textContent;
    copyButton.classList.add("is-copied");
    copyButton.textContent = "Copied";
    window.setTimeout(() => {
      copyButton.classList.remove("is-copied");
      copyButton.textContent = originalText;
    }, 1600);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(markCopied).catch(() => {
      fallbackCopy(text);
      markCopied();
    });
  } else {
    fallbackCopy(text);
    markCopied();
  }
});

document.addEventListener("change", (event) => {
  if (!(event.target instanceof HTMLInputElement)) return;
  if (!event.target.matches('.study-alignment-survey input[type="radio"]')) return;

  const appWindow = event.target.closest(".study-app-window");
  if (!appWindow) return;
  window.setTimeout(() => resetInteractiveStudyApp(appWindow), 650);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const modal = document.querySelector("#detail-modal[open]");
  if (modal?.close) modal.close();
});

function fallbackCopy(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "-999px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}
