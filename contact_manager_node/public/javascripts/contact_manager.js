let contactsCollection;
let contact;
let events;
let manager;
let search;

class Manager {
  constructor() {
    contactsCollection = new Contacts();
    contact = new Contact();
    contactsCollection.getAllContacts();
    events = new Events();
    search = new Search();
  }

  renderTemplate(contacts, templateHTML,element) {
    let template = Handlebars.compile(templateHTML);
    let compiledHTML;

    if (Array.isArray(contacts)) {
      if (document.getElementById('contacts')) {
        document.getElementById('contacts').remove();
      }

      this.hideElement(document.querySelector('.lower-text-button'));
      compiledHTML = template({ contacts: contacts });
      element.insertAdjacentHTML('beforeend', compiledHTML);
      events.bindSecondRound();

      this.showContactsButtonSection = this.showAllContactsButton.parentNode;
    } else {
      if (contacts) {
        compiledHTML = template(contacts);
      } else {
        compiledHTML = template();
      }

      element.innerHTML = compiledHTML;
      this.formHeading = element.querySelector('h2')
      this.hideElement(document.querySelector('.full'));
      events.bindThirdRound();

      if (contacts) {
        this.addFormHeading('Edit Contact')
      } else {
        this.addFormHeading('Create Contact')
      }

      events.bindFourthRound();
    }
  }

  renderDisplayContactsTemplate(contacts, input) {
    if (contacts.length > 0) {
      let templateHTML = document.getElementById('contacts-template').innerHTML;
      let element = document.getElementById('contacts-display');
      this.renderTemplate(contacts, templateHTML, element);
      events.bindFirstRound();
    } else {
      this.lowerText = document.querySelector('.text');
      this.lowerButton = document.querySelector('.button');
      this.showElement(document.querySelector('.lower-text-button'));

      if (document.getElementById('contacts')) {
        this.hideElement(document.getElementById('contacts'));
      }

      if (this.showContactsButtonSection) {
        this.hideElement(this.showContactsButtonSection);
      }

      this.replaceText(input);
      events.bindFirstRound();
    }
  }

  renderFormTemplate(contact) {
    search.clearSearch();

    let templateHTML = document.getElementById('form-template').innerHTML;
    let element = document.getElementById('add-edit-form');

    this.renderTemplate(contact, templateHTML, element);
  }

  refreshContactsDisplay() {
    if (this.addEditForm) {
      this.addEditForm.reset();
      this.addEditForm.remove();
    }

    this.showElement(document.querySelector('.full'));
  }

  showElement(elem) {
    elem.style.display = 'block';
  }

  hideElement(elem) {
    elem.style.display = 'none';
  }

  addFormHeading(text) {
    this.formHeading.textContent = text;
  }

  replaceText(input) {
    let text = 'There are no contacts.';
    if (input) {
      text = text.split('')
      text.pop();
      text = text.join('');
      this.lowerText.textContent = text + ` starting with ${input}.`
      this.hideElement(this.lowerButton);
    } else {
      this.lowerText.textContent = text;
      this.showElement(this.lowerButton);
    }
  }

  validateFormFields() {
    contact.getFormFields();

    if (!contact.fullName.value) {
      this.displayErrorMessage(contact.fullName, 'Please provide a valid name.');
    } else {
      this.displayErrorMessage(contact.fullName, '');
    }

    if (!contact.email.value || !contact.email.value.match(/.+@.+/)) {
      this.displayErrorMessage(contact.email, 'Please provide a valid email address.');
    } else {
      this.displayErrorMessage(contact.email, '');
    }

    if (!contact.phoneNumber.value || !contact.phoneNumber.value.match(/\d{3}-\d{3}-\d{4}/)) {
      this.displayErrorMessage(contact.phoneNumber, 'Please provide a valid phone number.');
    } else {
      this.displayErrorMessage(contact.phoneNumber, '');
    }

    if (!contact.tags.value || !contact.tags.value.match(/^[0-9a-zA-Z]+(,[0-9a-zA-Z]+)*$/)) {
      this.displayErrorMessage(contact.tags, 'Please provide valid tags.');
    } else {
      this.displayErrorMessage(contact.tags, '');
    }
  }

  displayErrorMessage(field, message) {
    field.parentNode.lastElementChild.textContent = message;
  }

  handleAddEditContact(e) {
    e.preventDefault();
    e.stopPropagation();

    let formType = e.target.className;
    let id = e.target.closest('div').id;

    if (formType === 'add') {
      this.renderFormTemplate();
    } else {
      contact.getSingleContact(id);
    }
  }

  handleAddEditSubmit(e) {
    e.preventDefault();
    let id = e.target.dataset.id;

    if (!manager.addEditForm.checkValidity()) {
      this.validateFormFields();
    } else {
      let data = JSON.stringify(Object.fromEntries(new FormData(this.addEditForm)));

      if (id) {
        contact.updateContact(data, id);
        this.hideElement(this.showContactsButtonSection);
      } else {
        contactsCollection.createNewContact(data);
      }
    }
  }

  handleAddEditCancel(e) {
    e.preventDefault();
    this.refreshContactsDisplay();
  }

  handleDelete(e) {
    e.preventDefault();
    let id = e.target.closest('div').id;

    contact.deleteContact(id);
    this.hideElement(this.showContactsButtonSection);

    if (search.isSearchInput()) {
      search.clearSearch();
    }
  }

  handleTagClick(e) {
    e.preventDefault();
    this.showElement(this.showContactsButtonSection);

    let tag = e.target.textContent;
    let taggedContacts = [];

    [...contactsCollection.contacts].forEach(contact => {
      if (contact.tags) {
        if (contact.tags.includes(tag)) {
          taggedContacts.push(contact);
        }
      }
    });

    this.renderDisplayContactsTemplate(taggedContacts);
  }

  handleShowAll(e) {
    e.preventDefault();

    this.renderDisplayContactsTemplate(contactsCollection.contacts);
    this.hideElement(this.showContactsButtonSection);

    if (search.isSearchInput) {
       search.clearSearch();
    }
  }

  handleInputChange(e) {
    e.preventDefault();
    let value = search.searchInput.value;

    if (contactsCollection.contacts.length > 0) {
      if (value.length > 0) {
        this.showElement(this.showContactsButtonSection);
      } else {
        this.hideElement(this.showContactsButtonSection);
      }
    }

    let filteredContacts = contactsCollection.contacts.filter(contact => {
      return contact.full_name.toLowerCase().startsWith(value.toLowerCase());
    });

    this.renderDisplayContactsTemplate(filteredContacts, value);
  }
}

class Contacts {
  constructor() {
    this.contacts;
  }

  getAllContacts() {
    fetch('/api/contacts')
    .then(response => response.json())
    .then(data => {
      this.contacts = data;
      [...this.contacts].forEach(contact => {
        if (contact.tags) {
          contact.tags = contact.tags.split(',');
        }
      });
      manager.renderDisplayContactsTemplate(this.contacts);
    })
  }

  createNewContact(data) {
    let status;

    fetch('/api/contacts/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    })
    .then(response => {
      status = response.status;
      if (status === 201) {
        return response.json();
      } else {
        return response.text();
      }
    })
    .then(data => {
      if (status === 201) {
        this.getAllContacts();
        manager.refreshContactsDisplay();
      } else {
        alert(data);
      }
    });
  }
}

class Contact {
  constructor() {
    this.contact;
  }

  getSingleContact(id) {
    fetch(`/api/contacts/${id}`)
    .then(response => response.json())
    .then(data => {
      this.contact = data;
      manager.renderFormTemplate(this.contact);
    });
  }

  updateContact(data, id) {
    let status;

    fetch(`api/contacts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    })
    .then(response => {
      status = response.status;
      if (status === 201) {
        return response.json();
      } else {
        return response.text();
      }
    })
    .then(data => {
      if (status === 201) {
        contactsCollection.getAllContacts();
        manager.refreshContactsDisplay();
      } else {
        alert(data);
      }
    })
  }

  deleteContact(id) {
    let status;

    fetch(`/api/contacts/${id}`, {
      method: 'DELETE',
    })
    .then(response => {
      status = response.status;
      return response.text()
    })
    .then(responseText => {
      if (status == 204) {
        contactsCollection.getAllContacts();
        manager.refreshContactsDisplay();
      } else {
        alert('Contact not found.')
      }
    });
  }

  getFormFields() {
    this.fullName = document.getElementById('full_name');
    this.email = document.getElementById('email');
    this.phoneNumber = document.getElementById('phone_number');
    this.tags = document.getElementById('tags');
  }
}

class Events {
  bindFirstRound() {
    manager.addContactButtons = document.querySelectorAll('.add');

    [...manager.addContactButtons].forEach(button => {
      button.addEventListener('click', manager.handleAddEditContact.bind(manager));
    });

    search.searchInput.addEventListener('input', manager.handleInputChange.bind(manager));
  }

  bindSecondRound() {
    manager.showAllContactsButton = document.getElementById('show-all-contacts');
    manager.editButtons = document.querySelectorAll('.edit');
    manager.deleteButtons = document.querySelectorAll('.delete');
    manager.tags = document.querySelectorAll('.tags');

    [...manager.editButtons].forEach(button => {
      button.addEventListener('click', manager.handleAddEditContact.bind(manager));
    });

    [...manager.deleteButtons].forEach(button => {
      button.addEventListener('click', manager.handleDelete.bind(manager));
    });

    [...manager.tags].forEach(tag => {
      tag.addEventListener('click', manager.handleTagClick.bind(manager));
    });

    manager.showAllContactsButton.addEventListener('click', manager.handleShowAll.bind(manager));
  }

  bindThirdRound() {
    manager.addEditForm = document.getElementById('add-edit-contact');
    manager.addEditForm.addEventListener('submit', manager.handleAddEditSubmit.bind(manager));
  }

  bindFourthRound() {
    manager.cancelAddEditButton = document.getElementById('cancel-add-edit');
    manager.cancelAddEditButton.addEventListener('click', manager.handleAddEditCancel.bind(manager));
  }
}

class Search {
  constructor() {
    this.searchInput = document.getElementById('search');
  }

  clearSearch() {
    this.searchInput.value = '';
  }

  isSearchInput() {
    return this.searchInput.value;
  }
}

manager = new Manager();