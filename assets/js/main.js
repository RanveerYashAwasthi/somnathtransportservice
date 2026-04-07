const setActiveNav = () => {
  const page = document.body.dataset.page;
  const navLinks = document.querySelectorAll("[data-nav-link]");

  navLinks.forEach((link) => {
    if (link.dataset.navLink === page) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const initNavToggle = () => {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
};

const setCurrentYear = () => {
  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidPhone = (value) => /^[0-9+()\-.\s]{10,25}$/.test(value);

const setFormMessage = (statusNode, type, message) => {
  statusNode.className = "form-status";

  if (type) {
    statusNode.classList.add(`is-${type}`);
  }

  statusNode.textContent = message;
};

const validateForm = (form) => {
  const requiredFields = ["name", "company", "pickupLocation", "dropLocation", "cargoType", "phone", "email"];
  let firstInvalidField = null;

  requiredFields.forEach((fieldName) => {
    const field = form.elements[fieldName];
    const value = field.value.trim();

    field.setCustomValidity("");

    if (!value) {
      field.setCustomValidity("This field is required.");
    }

    if (fieldName === "email" && value && !isValidEmail(value)) {
      field.setCustomValidity("Enter a valid email address.");
    }

    if (fieldName === "phone" && value && !isValidPhone(value)) {
      field.setCustomValidity("Enter a valid phone number.");
    }

    if (!firstInvalidField && !field.checkValidity()) {
      firstInvalidField = field;
    }
  });

  if (firstInvalidField) {
    firstInvalidField.reportValidity();
    firstInvalidField.focus();
    return false;
  }

  return true;
};

const initQuoteForm = () => {
  const form = document.querySelector("[data-quote-form]");

  if (!form) {
    return;
  }

  const statusNode = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector('button[type="submit"]');
  const startedAtField = form.querySelector("[data-started-at]");

  const resetStartedAt = () => {
    if (startedAtField) {
      startedAtField.value = String(Date.now());
    }
  };

  resetStartedAt();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateForm(form)) {
      setFormMessage(statusNode, "error", "Please correct the highlighted fields and try again.");
      return;
    }

    submitButton.disabled = true;
    setFormMessage(statusNode, "", "Sending your quote request...");

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({ ok: false, message: "Unexpected server response." }));

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "We could not send your request right now.");
      }

      form.reset();
      resetStartedAt();
      setFormMessage(statusNode, "success", result.message || "Your quote request has been sent.");
    } catch (error) {
      setFormMessage(
        statusNode,
        "error",
        error.message || "We could not send your request right now. Please call (614) 555-0100."
      );
    } finally {
      submitButton.disabled = false;
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setActiveNav();
  initNavToggle();
  setCurrentYear();
  initQuoteForm();
});