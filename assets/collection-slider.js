import { Component } from '@theme/component';

/**
 * @typedef {Object} CollectionSliderRefs
 * @property {HTMLElement[]} tab - Tab buttons
 * @property {HTMLElement[]} panel - Tab panels
 * @property {HTMLAnchorElement} shopAllLink - Shop All CTA link
 */

/** @extends {Component<CollectionSliderRefs>} */
class CollectionSlider extends Component {
  connectedCallback() {
    super.connectedCallback();

    this.collectionUrls = [
      this.dataset.collection1Url || '#',
      this.dataset.collection2Url || '#',
    ];

    this.#initObserver();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /**
   * Handle tab click to switch active panel.
   *
   * @param {Event} event
   */
  handleTabClick(event) {
    const clickedTab = event.currentTarget;
    const index = Number(clickedTab.dataset.index);

    if (!this.refs.tab || !this.refs.panel) return;

    const tabs = Array.isArray(this.refs.tab) ? this.refs.tab : [this.refs.tab];
    const panels = Array.isArray(this.refs.panel) ? this.refs.panel : [this.refs.panel];

    for (const tab of tabs) {
      const isActive = Number(tab.dataset.index) === index;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    }

    for (const panel of panels) {
      const isActive = Number(panel.dataset.index) === index;

      if (isActive) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    }

    if (this.refs.shopAllLink) {
      this.refs.shopAllLink.href = this.collectionUrls[index] || '#';
    }
  }

  #initObserver() {
    if (typeof IntersectionObserver === 'undefined') {
      const animatedEls = this.querySelectorAll('.collection-slider__animate');

      for (const el of animatedEls) {
        el.classList.add('is-visible');
      }

      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 }
    );

    const animatedEls = this.querySelectorAll('.collection-slider__animate');

    for (const el of animatedEls) {
      this.observer.observe(el);
    }
  }
}

customElements.define('collection-slider', CollectionSlider);
