document.documentElement.classList.add("js-enabled");

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

const hero = document.querySelector(".hero");
const heroScrollTarget = document.querySelector(".paper-title-block");

if (hero && heroScrollTarget) {
  let isHeroSnapping = false;
  let heroTouchStartY = 0;

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const getHeroTargetY = () =>
    heroScrollTarget.getBoundingClientRect().top + window.scrollY;

  const canSnapFromHero = (deltaY) => {
    if (deltaY <= 0 || isHeroSnapping) return false;
    const targetY = getHeroTargetY();
    return window.scrollY < targetY - 4 && hero.getBoundingClientRect().bottom > 24;
  };

  const snapFromHero = () => {
    isHeroSnapping = true;
    window.scrollTo({
      top: getHeroTargetY(),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
    window.setTimeout(() => {
      isHeroSnapping = false;
    }, 850);
  };

  window.addEventListener(
    "wheel",
    (event) => {
      if (!canSnapFromHero(event.deltaY)) return;
      event.preventDefault();
      snapFromHero();
    },
    { passive: false },
  );

  window.addEventListener(
    "touchstart",
    (event) => {
      heroTouchStartY = event.touches[0]?.clientY || 0;
    },
    { passive: true },
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      const touchY = event.touches[0]?.clientY || heroTouchStartY;
      const deltaY = heroTouchStartY - touchY;
      if (!canSnapFromHero(deltaY)) return;
      event.preventDefault();
      heroTouchStartY = touchY;
      snapFromHero();
    },
    { passive: false },
  );

  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (!["ArrowDown", "PageDown", " "].includes(event.key)) return;
    if (!canSnapFromHero(1)) return;
    event.preventDefault();
    snapFromHero();
  });
}

const motivationScrollSections = Array.from(
  document.querySelectorAll("[data-motivation-scroll]"),
);

motivationScrollSections.forEach((section) => {
  const images = Array.from(section.querySelectorAll("[data-motivation-image]"));
  const additions = Array.from(section.querySelectorAll("[data-motivation-addition]"));
  if (!images.length) return;

  let activeIndex = -1;
  let isQueued = false;

  const setActive = (nextIndex) => {
    if (nextIndex === activeIndex) return;
    activeIndex = nextIndex;

    images.forEach((image, index) => {
      image.classList.toggle("is-active", index === activeIndex);
    });

    additions.forEach((addition, index) => {
      addition.classList.toggle("is-active", activeIndex > index);
    });
  };

  const update = () => {
    const rect = section.getBoundingClientRect();
    const scrollable = Math.max(1, rect.height - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
    const holdRatio = 0.72;
    const nextIndex =
      images.length === 2
        ? progress < holdRatio
          ? 0
          : 1
        : Math.min(images.length - 1, Math.floor(progress * images.length));
    setActive(nextIndex);
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

  let activeIndex = -1;
  let isQueued = false;

  const setActive = (nextIndex) => {
    if (nextIndex === activeIndex) return;
    activeIndex = nextIndex;

    images.forEach((image, index) => {
      image.classList.toggle("is-active", index === activeIndex);
    });

    steps.forEach((step, index) => {
      step.classList.toggle("is-visible", index <= activeIndex);
      step.classList.toggle("is-active", index === activeIndex);
    });

    prefixes.forEach((prefix, index) => {
      prefix.classList.toggle("is-visible", activeIndex >= index + 1);
    });
  };

  const update = () => {
    const rect = section.getBoundingClientRect();
    const scrollable = Math.max(1, rect.height - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
    const nextIndex =
      images.length === 3
        ? progress < 0.22
          ? -1
          : progress < 0.46
            ? 0
            : progress < 0.84
              ? 1
              : 2
        : Math.min(images.length - 1, Math.floor(progress * images.length));
    setActive(nextIndex);
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
    const rect = section.getBoundingClientRect();
    const scrollable = Math.max(1, rect.height - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
    section.classList.toggle("is-blocked", progress > 0.35);
    section.classList.toggle("is-formative", progress > 0.72);
    section.classList.toggle("is-context-needed", progress > 0.86);
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
      // Metadata may not be ready the first time the section enters view.
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
      // Metadata may not be ready the first time the section enters view.
    }
  };

  const setPhase = (phase) => {
    section.classList.toggle("is-left-active", phase === "left");
    section.classList.toggle("is-right-active", phase === "right");

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
    cycleTimers.push(window.setTimeout(() => setPhase("left"), 650));
    cycleTimers.push(window.setTimeout(() => setPhase("right"), 4100));
    cycleTimers.push(window.setTimeout(() => {
      if (!isRunning) return;
      scheduleCycle();
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
          if (entry.isIntersecting) {
            startCycle();
          } else {
            stopCycle();
          }
        });
      },
      { threshold: 0.32 },
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
  6: {
    title: "6. User feedback",
    copy: "Users can mark a message correct or incorrect when INA misunderstands the context.",
  },
  7: {
    title: "7. Refinement",
    copy: "Feedback is analyzed so future decisions better match the user’s intention.",
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
const systemOverviewStepOrder = ["overall", "1", "2-3", "4", "5", "6", "7"];

systemOverviews.forEach((overview) => {
  const overallButton = overview.querySelector("[data-system-overview-overall]");
  const buttons = Array.from(overview.querySelectorAll("[data-system-overview-step]"));
  const previousButton = overview.querySelector("[data-system-overview-prev]");
  const nextButton = overview.querySelector("[data-system-overview-next]");
  const regions = Array.from(overview.querySelectorAll("[data-system-overview-region]"));
  const title = overview.querySelector("[data-system-overview-title]");
  const copy = overview.querySelector("[data-system-overview-copy]");
  let currentActiveStep = "overall";

  const setActiveStep = (step) => {
    const activeStep = step === "2" || step === "3" ? "2-3" : step;
    const isOverall = activeStep === "overall";
    const details = systemOverviewDetails[activeStep] || systemOverviewDetails.overall;
    const stepIndex = systemOverviewStepOrder.indexOf(activeStep);

    currentActiveStep = activeStep;
    overview.setAttribute("data-active-step", activeStep);
    overview.classList.toggle("is-overall", isOverall);

    if (overallButton) {
      overallButton.classList.toggle("is-active", isOverall);
      overallButton.setAttribute("aria-pressed", String(isOverall));
    }

    if (previousButton) {
      previousButton.disabled = isOverall || stepIndex <= 0;
    }

    if (nextButton) {
      nextButton.disabled =
        stepIndex === -1 || stepIndex >= systemOverviewStepOrder.length - 1;
    }

    buttons.forEach((button) => {
      const buttonStep = button.getAttribute("data-system-overview-step");
      const isActive =
        !isOverall &&
        (activeStep === "2-3"
          ? buttonStep === "2" || buttonStep === "3"
          : buttonStep === activeStep);
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    regions.forEach((region) => {
      const regionStep = region.getAttribute("data-system-overview-region");
      region.classList.toggle(
        "is-active",
        !isOverall &&
          (activeStep === "2-3"
            ? regionStep === "2" || regionStep === "3"
            : regionStep === activeStep),
      );
    });

    if (title) renderSystemOverviewTitle(title, details.title);
    if (copy) copy.textContent = details.copy;
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
  const video = section.querySelector("[data-ina-demo-video]");
  const caption = section.querySelector("[data-ina-step-caption]");
  const number = section.querySelector("[data-ina-step-number]");
  const text = section.querySelector("[data-ina-step-text]");
  if (!video || !caption || !number || !text) return;

  let activeIndex = -1;
  let switchTimer = 0;
  let playTimer = 0;
  let hasStarted = false;
  const titleRevealDelay = 2450;

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

  video.addEventListener("loadedmetadata", syncStep);
  video.addEventListener("timeupdate", syncStep);
  video.addEventListener("seeked", syncStep);
  video.pause();
  syncStep();

  const playVideo = () => {
    hasStarted = true;
    section.classList.add("is-demo-playing");
    video.play().catch(() => {});
  };

  const scheduleIntroPlay = () => {
    window.clearTimeout(playTimer);
    if (hasStarted) {
      playVideo();
      return;
    }
    try {
      video.currentTime = 0;
    } catch {
      // Ignore browsers that do not allow seeking before metadata is ready.
    }
    section.classList.remove("is-demo-playing");
    syncStep();
    playTimer = window.setTimeout(playVideo, titleRevealDelay);
  };

  const pauseIntroPlay = () => {
    window.clearTimeout(playTimer);
    section.classList.remove("is-demo-playing");
    video.pause();
  };

  if ("IntersectionObserver" in window) {
    const inaIntroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            scheduleIntroPlay();
          } else {
            pauseIntroPlay();
          }
        });
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0.28 },
    );

    inaIntroObserver.observe(section);
  } else {
    scheduleIntroPlay();
  }
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
