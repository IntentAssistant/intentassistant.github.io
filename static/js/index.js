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

  const detailButton = event.target.closest("[data-detail-toggle]");
  if (detailButton) {
    const source = document.querySelector(detailButton.getAttribute("data-detail-toggle"));
    const modal = document.querySelector("#detail-modal");
    const title = modal?.querySelector("#detail-modal-title");
    const body = modal?.querySelector("[data-detail-modal-body]");

    if (source && modal && title && body) {
      title.textContent = detailButton.getAttribute("data-detail-title") || "Details";
      body.innerHTML = source.innerHTML;
      modal.classList.toggle("detail-modal-wide", detailButton.getAttribute("data-detail-variant") === "wide");

      if (typeof modal.showModal === "function") {
        modal.showModal();
      } else {
        modal.setAttribute("open", "");
      }
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
