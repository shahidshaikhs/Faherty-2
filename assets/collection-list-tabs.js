import { Component } from '@theme/component';

/**
 * @typedef {Object} CollectionListTabsRefs
 * @property {HTMLButtonElement[]} tab - Tab buttons
 * @property {HTMLElement[]} panel - Tab panels
 * @property {HTMLElement[]} scrollArea - Scroll containers inside panels
 * @property {HTMLElement} progressTrack - Progress bar track
 * @property {HTMLElement} progressBar - Progress bar fill
 * @property {HTMLButtonElement} prevBtn - Previous arrow button
 * @property {HTMLButtonElement} nextBtn - Next arrow button
 */

/** @extends {Component<CollectionListTabsRefs>} */
class CollectionListTabs extends Component {
  /** @type {number} */
  #activeIndex = 0;

  /** @type {IntersectionObserver | null} */
  #observer = null;

  /** @type {AbortController | null} */
  #scrollAbort = null;

  connectedCallback() {
    super.connectedCallback();
    this.#initScrollListener();
    this.#updateArrowState();
    this.#initObserver();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.#scrollAbort) {
      this.#scrollAbort.abort();
      this.#scrollAbort = null;
    }

    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }
  }

  /**
   * Handle tab click — switch active tab and panel
   * @param {Event} event
   */
  handleTabClick(event) {
    const button = event.currentTarget;
    const index = parseInt(button.dataset.index, 10);

    if (index === this.#activeIndex) return;

    this.#activeIndex = index;

    const tabs = Array.isArray(this.refs.tab) ? this.refs.tab : [this.refs.tab];
    const panels = Array.isArray(this.refs.panel) ? this.refs.panel : [this.refs.panel];

    for (const tab of tabs) {
      const tabIndex = parseInt(tab.dataset.index, 10);
      const isActive = tabIndex === index;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    }

    for (const panel of panels) {
      const panelIndex = parseInt(panel.dataset.panelIndex, 10);
      const isActive = panelIndex === index;

      if (isActive) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    }

    this.#initScrollListener();
    this.#updateProgressBar();
    this.#updateArrowState();

    // Reset scroll position of new active panel
    const activeScrollArea = this.#getActiveScrollArea();

    if (activeScrollArea) {
      activeScrollArea.scrollLeft = 0;
    }
  }

  /**
   * Handle previous arrow click
   */
  handlePrevClick() {
    const scrollArea = this.#getActiveScrollArea();
    if (!scrollArea) return;

    const cardWidth = this.#getCardScrollWidth(scrollArea);
    scrollArea.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  }

  /**
   * Handle next arrow click
   */
  handleNextClick() {
    const scrollArea = this.#getActiveScrollArea();
    if (!scrollArea) return;

    const cardWidth = this.#getCardScrollWidth(scrollArea);
    scrollArea.scrollBy({ left: cardWidth, behavior: 'smooth' });
  }

  /**
   * Get the scroll width of one card (including gap)
   * @param {HTMLElement} scrollArea
   * @returns {number}
   */
  #getCardScrollWidth(scrollArea) {
    const cards = scrollArea.querySelector('.collection-list-tabs__cards');
    const firstCard = cards?.querySelector('.collection-list-tabs__card');

    if (!firstCard) return 300;

    const gap = parseFloat(getComputedStyle(cards).gap) || 0;
    return firstCard.offsetWidth + gap;
  }

  /**
   * Get the currently active scroll area
   * @returns {HTMLElement | null}
   */
  #getActiveScrollArea() {
    const scrollAreas = Array.isArray(this.refs.scrollArea)
      ? this.refs.scrollArea
      : [this.refs.scrollArea];

    return scrollAreas[this.#activeIndex] || null;
  }

  /**
   * Initialize scroll event listener on active scroll area
   */
  #initScrollListener() {
    if (this.#scrollAbort) {
      this.#scrollAbort.abort();
    }

    this.#scrollAbort = new AbortController();
    const scrollArea = this.#getActiveScrollArea();

    if (!scrollArea) return;

    scrollArea.addEventListener(
      'scroll',
      () => {
        this.#updateProgressBar();
        this.#updateArrowState();
      },
      { signal: this.#scrollAbort.signal, passive: true }
    );
  }

  /**
   * Update the progress bar width based on scroll position
   */
  #updateProgressBar() {
    const scrollArea = this.#getActiveScrollArea();
    const progressBar = this.refs.progressBar;

    if (!scrollArea || !progressBar) return;

    const maxScroll = scrollArea.scrollWidth - scrollArea.clientWidth;

    if (maxScroll <= 0) {
      progressBar.style.width = '100%';
      return;
    }

    const percent = (scrollArea.scrollLeft / maxScroll) * 100;
    progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }

  /**
   * Update arrow button disabled states
   */
  #updateArrowState() {
    const scrollArea = this.#getActiveScrollArea();
    const prevBtn = this.refs.prevBtn;
    const nextBtn = this.refs.nextBtn;

    if (!scrollArea || !prevBtn || !nextBtn) return;

    const maxScroll = scrollArea.scrollWidth - scrollArea.clientWidth;
    const atStart = scrollArea.scrollLeft <= 1;
    const atEnd = scrollArea.scrollLeft >= maxScroll - 1;

    prevBtn.style.opacity = atStart ? '0.5' : '1';
    prevBtn.style.pointerEvents = atStart ? 'none' : 'auto';
    nextBtn.style.opacity = atEnd ? '0.5' : '1';
    nextBtn.style.pointerEvents = atEnd ? 'none' : 'auto';
  }

  /**
   * Initialize IntersectionObserver for entry animations
   */
  #initObserver() {
    const animateElements = this.querySelectorAll('.collection-list-tabs__animate');

    if (!animateElements.length) return;

    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.#observer?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 }
    );

    for (const el of animateElements) {
      this.#observer.observe(el);
    }
  }
}

customElements.define('collection-list-tabs', CollectionListTabs);
