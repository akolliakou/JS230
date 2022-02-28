(() => {
let photoCollection;
let photoComments;
let show;


class UI {
  constructor() {
    photoCollection = new Photos();
    photoCollection.getPhotos();
    this.next;
    this.previous;
    this.figures;
    this.currentFigure;

    this.bindEvents();
  }

  bindEvents() {
    this.next = document.querySelector('.next');
    this.previous = document.querySelector('.prev');

    this.next.addEventListener('click', this.handleNext.bind(this));
    this.previous.addEventListener('click', this.handlePrevious.bind(this));
  }

  renderPhotos(photos) {
    let templateHTML = document.getElementById('photos').innerHTML;
    let element = document.getElementById('slides');
    this.renderTemplate(photos, templateHTML, element);
  }

  renderInformation(photo) {
    let templateHTML = document.getElementById('photo_information').innerHTML;
    let element = document.querySelector('section header')
    this.renderTemplate(photo, templateHTML, element)
  }

  renderComments(comments) {
    let templateHTML = document.getElementById('photo_comments').innerHTML;
    let element = document.querySelector('#comments ul');
    let partialTemplateHTML = document.getElementById('photo_comment').innerHTML;

    Handlebars.registerPartial('photo_comment', partialTemplateHTML);
    this.renderTemplate(comments, templateHTML, element, partialTemplateHTML)
  }

  renderTemplate(data, templateHTML, element, partialTemplateHTML) {
    let template;
    let compiledHTML;

    if (Array.isArray(data)) {
      if (element.id === 'slides') {
        template = Handlebars.compile(templateHTML);
        compiledHTML = template({ photos: data });
        element.innerHTML = compiledHTML;
      } else {
        template = Handlebars.compile(templateHTML);
        compiledHTML = template({ comments: data });
        element.innerHTML = compiledHTML;
      }
    } else {
      if (partialTemplateHTML) {
        template = Handlebars.compile(partialTemplateHTML);
        compiledHTML = template(data);
        element.insertAdjacentHTML('beforeend', compiledHTML);
      } else {
        template = Handlebars.compile(templateHTML);
        compiledHTML = template(data);
        element.innerHTML = compiledHTML;
      }
    }
  }

  getCurrentFigure() {
    this.figures = document.querySelectorAll('figure[data-id]');
    return [...this.figures].filter(figure => figure.style.display !== 'none')[0];
  }

  handleNext(e) {
    e.preventDefault();
    this.currentFigure = this.getCurrentFigure();
    let nextFigure;

    if (this.currentFigure.dataset.id !== '3') {
      nextFigure = [...this.figures][[...this.figures].indexOf(this.currentFigure) + 1];
    } else {
      nextFigure = [...this.figures][0];
    }

    $(this.currentFigure).fadeOut(400);
    $(nextFigure).fadeIn(400);

    let nextPhoto = photoCollection.photos.filter(photo => photo.id === Number(nextFigure.dataset.id))[0]

    show.renderInformation(nextPhoto);
    photoComments.getComments(nextPhoto.id);
    photoCollection.bindEvents();
  }

  handlePrevious(e) {
    e.preventDefault();
    this.currentFigure = this.getCurrentFigure();
    let prevFigure;

    if (this.currentFigure.dataset.id !== '1') {
      prevFigure = [...this.figures][[...this.figures].indexOf(this.currentFigure) - 1];
    } else {
      prevFigure = [...this.figures][2];
    }

    $(this.currentFigure).fadeOut(400);
    $(prevFigure).fadeIn(400);

    let prevPhoto = photoCollection.photos.filter(photo => photo.id === Number(prevFigure.dataset.id))[0]

    show.renderInformation(prevPhoto);
    photoComments.getComments(prevPhoto.id);
    photoCollection.bindEvents();
  }
}

class Photos {
  constructor() {
    photoComments = new Comments();
    this.likeButton;
    this.favButton;
    this.photos;
  }

  bindEvents() {
    this.likeButton = document.querySelector('.like');
    this.favButton = document.querySelector('.favorite');

    this.likeButton.addEventListener('click', this.handlePhotoButton.bind(this));
    this.favButton.addEventListener('click', this.handlePhotoButton.bind(this));
  }

  getPhotos() {
    fetch('/photos')
    .then(response => response.json())
    .then(data => {
      this.photos = data;
      show.renderPhotos(this.photos);
      show.renderInformation(this.photos[0]);
      photoComments.getComments(this.photos[0].id);
      this.bindEvents();
    });
  }

  updatePhotos() {
    fetch('/photos')
    .then(response => response.json())
    .then(data => {
      this.photos = data;
    });
  }

  handlePhotoButton(e) {
    e.preventDefault();
    e.stopPropagation();

    let button = e.target;
    let href = button.getAttribute('href');

    fetch(href, {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: 'photo_id=' + button.dataset.id,
    })
    .then(response => response.json())
    .then(data => {
      button.textContent = button.textContent.replace(/\d+/g, data.total);
      this.updatePhotos();
    });
  }
}

class Comments {
  constructor() {
    this.commentForm = document.querySelector('form');
    this.newComment;
    this.comments;

    this.bindEvents();
  }

  bindEvents() {
    this.commentForm.addEventListener('submit', this.handleSubmit.bind(this));
  }

  getComments(id) {
    fetch(`/comments?photo_id=${id}`)
    .then(response => response.json())
    .then(data => {
      this.comments = data;
      show.renderComments(this.comments);
    })
  }

  getEncodedFormData(formData) {
    let encodedArray = [];

    for (let [k, v] of formData) {
      if (k === 'photo_id') {
        v = show.getCurrentFigure().dataset.id;
      }

      encodedArray.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    }

    return encodedArray.join('&');
  }

  handleSubmit(e) {
    e.preventDefault();

    let data = this.getEncodedFormData(new FormData(this.commentForm));

    fetch('/comments/new', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: data
    })
    .then(response => response.json())
    .then(data => {
      this.newComment = data;
      show.renderComments(data);
      this.commentForm.reset();
    });
  }
}

  document.addEventListener('DOMContentLoaded', function() {
    show = new UI();
  })
})()