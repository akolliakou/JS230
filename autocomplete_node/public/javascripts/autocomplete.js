import debounce from './debounce.js';

const Autocomplete = {
  init() {
    this.input = document.querySelector('input');
    this.listUI = document.querySelector('ul');
    this.overlay = document.querySelector('div.autocomplete-overlay')
    this.url = '/countries?matching='
    this.selectedIndex = null;
    this.matches = [];

    this.inputChanged = debounce(this.inputChanged.bind(this), 300);
    this.styleOverlay();
    this.bindEvents();
  },

  styleOverlay() {
    this.overlay.style.width =`${this.input.clientWidth}px`
  },

  bindEvents() {
    this.input.addEventListener('input', this.inputChanged);
    this.input.addEventListener('keydown', this.handleKeydown.bind(this));
    this.listUI.addEventListener('click', this.handleClick.bind(this));
  },

  inputChanged() {
    let value = this.input.value;
    this.latestValue = value;

    if (value.length > 0) {
      this.getMatches(value, (matches) => {
        if (matches.length > 0) {
          this.matches = matches;
          this.setOverlay();
          this.setList();
        } else {
          this.reset();
        }
      });
    } else {
      this.reset();
    }
  },

  clearList() {
    this.listUI.innerHTML = '';
  },

  clearOverlay() {
    this.overlay.textContent = '';
  },

  reset() {
    this.clearOverlay();
    this.clearList();
    this.selectedIndex = null;
  },

  setOverlay() {
    this.overlay.textContent = this.input.value + this.matches[0].slice(this.input.value.length);
  },

  populateList() {
    this.matches.forEach((match, idx) => {
      let li = document.createElement('li');
      li.classList.add('autocomplete-ui-choice');
      
      if (this.selectedIndex === idx) {
        li.classList.add('selected');
        this.input.value = match;
      }

      li.textContent = match;
      this.listUI.appendChild(li);
    });
  },

  setList() {
    this.listUI.innerHTML = '';
    this.populateList(this.matches);
  },

  getMatches(value, callback) {
    let request = new XMLHttpRequest();
    request.open('GET', `${this.url}${encodeURIComponent(value)}`);
    request.responseType = 'json';

    request.addEventListener('load', function() {
      let response = request.response;
      let matches = response.map(country => country.name);
      callback(matches);
    });

    request.send();
  },

  handleKeydown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();

      if (this.selectedIndex === null) {
        this.input.value = this.matches[0][0].toUpperCase() + this.matches[0].slice(1);
      } else {
        this.input.value = this.matches[this.selectedIndex][0].toUpperCase() + this.matches[this.selectedIndex].slice(1);
      }

      this.reset();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();

      if (this.selectedIndex === null || this.selectedIndex === this.matches.length - 1) {
        this.selectedIndex = 0;
      } else {
        this.selectedIndex += 1;
      }

      this.clearList();
      this.clearOverlay();
      this.populateList();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();

      if (this.selectedIndex === null || this.selectedIndex === 0) {
        this.selectedIndex = this.matches.length - 1;
      } else {
        this.selectedIndex -= 1;
      }

      this.clearList();
      this.clearOverlay();
      this.populateList();
    } else if (e.key === 'Enter') {
      e.preventDefault();

      if (this.selectedIndex === null) {
        this.input.value = this.matches[0];
        this.reset();
      } else {
        this.reset();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();

      this.input.value = this.latestValue;
      this.reset();
      this.populateList();
    }
  },

  handleClick(e) {
    this.input.value = e.target.textContent;
    this.reset();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  Autocomplete.init();
});