'use strict';

// vendor
import sweetalert2 from 'sweetalert2';
import * as _ from 'lodash';

/**
 * Display a dismissable loading notice.
 *
 * USAGE:
    showDismissableLoadingNotice();
    dispatch(loadLotsOfData())
      .then(hideDismissableLoadingNotice);
 *
 * @param {string} titleText (optional)
 * @param {string} buttonText (optional)
 * @returns {Promise}
 */
export function showDismissableLoadingNotice({ titleText, buttonText } = {}) {
  return sweetalert2({
    titleText: titleText || 'Loading...',
    confirmButtonText: buttonText || 'Continue loading in background',
    showCloseButton: true,
  });
}

/**
 * Hide a dismissable loading notice.
 * Resolves with original param that was passed in.
 *
 * @param {mixed} data
 * @returns {Promise}
 */
export function hideDismissableLoadingNotice(data) {
  return Promise.resolve(sweetalert2.close()).then(() => data);
}

/**
 * Helper function displays a Sweetalert prompt to the user, with Yes and Cancel buttons.
 *
 * USAGE:
 * promptAreYouSureBefore({
 *   ev,
 *   returnBool: true,
 * })
 *   .then(isConfirmed => {
 *     if (!isConfirmed) {
 *       return;
 *     }
 *     // user confirmed; proceed!
 *   })
 *
 * @param {event}  ev
 * @param {object} options
 * @param {event}  options.ev
 * @param {string} options.titleText
 * @param {string} options.type
 * @param {string} options.text
 * @param {string} options.confirmButtonText
 * @param {string} options.cancelButtonText
 * @param {bool}   options.returnBool - allows user to return a boolean instead of traditional swal result.
 * @returns {Promise}
 */
export function promptAreYouSureBefore(
  {
    ev,
    titleText = 'Are you sure?',
    type = 'warning',
    text = 'This action is irreversible!',
    confirmButtonText = 'Yes',
    cancelButtonText = 'Cancel',
    showCancelButton = true,
    showCloseButton = false,
    returnBool = false,
  } = {}
) {
  ev && ev.preventDefault && ev.preventDefault();
  return (
    sweetalert2({
      titleText,
      text,
      type,
      confirmButtonText,
      cancelButtonText,
      showCancelButton,
      showCloseButton,
    })
      .then(result => {
        if (returnBool) {
          return !!(
            result
            && !result.dismiss
            && result.value
          );
        }
        return result;
      })
  );
}

/**
 * Prompt and get user input.
 *
 * @param {object} options
 *
 * @param {string} options.titleText
 * @param {string} options.html - note - if set, will override options.text
 * @param {string} options.text
 *
 * @param {object[]} options.inputs
 * @param {string}   options.inputs[].fieldName - set this to determine the desired field name in the returned object.
 * @param {func}     options.inputs[].formatValue - set this to format the input value in the returned object.
 * @param {string}   options.inputs[].type - default = 'text'
 * @param {string}   options.inputs[].name
 * @param {string}   options.inputs[].id
 * @param {string}   options.inputs[].placeholder
 * @param {mixed}    options.inputs[].value
 * @param {string}   options.inputs[].label
 * @param {number}   options.inputs[].cols (type === 'textarea' only)
 * @param {number}   options.inputs[].rows (type === 'textarea' only)
 * @param {object[]} options.inputs[].options (type === 'select' only)
 *
 * @param {object[]} options.validations
 * @param {string}   options.validations[].id
 * @param {string}   options.validations[].name
 * @param {func}     options.validations[].validate
 * @param {string}   options.validations[].messageOnFail
 *
 * @param {object} data
 * @returns {Promise}
 */
export function getPromptedUserInput({
  titleText = 'User Input Needed',
  html = '',
  text = '',
  inputs = [],
  validations = [],
} = {}) {
  // each input must have an id and name prop.
  const validInputs = _.filter(
    inputs,
    input => !!input && !!input.id && !!input.name
  );

  if (!validInputs.length) {
    return Promise.reject('No valid inputs passed to getPromptedUserInput().');
  }

  const firstInputId = validInputs[0].id;
  const inputHtml =
    (html || text || '') +
    '<br/><br/>' +
    _.map(validInputs, input => getInputHtmlforPrompt(input)).join('');

  return sweetalert2({
    titleText,
    type: 'info',
    confirmButtonText: 'Submit',
    cancelButtonText: 'Cancel',
    showCancelButton: true,
    html: inputHtml,
    onOpen: () => {
      const input1 = document.getElementById(firstInputId);
      input1 && input1.focus();
    },
    preConfirm: getResultsAfterValidations({
      validations,
      inputs,
    }),
  }).then(result => {
    if (result.dismiss || !result.value) {
      throw new Error('stop-execution');
    }

    // return the user's inputted data.
    return result.value;
  });
}

/**
 * Get input html for use within Sweetalert prompt.
 *
 * @param {object} input
 * @returns {string}
 */
function getInputHtmlforPrompt(input) {
  const inputDisabled = input.disabled ? 'disabled' : '';

  let label;
  if (input.label) {
    label = `
      <p class="marg-top-20">
        <label htmlFor="${input.id || ''}">${input.label}</label>
      </p>
    `;
  }

  if (input.type === 'textarea') {
    return `
      ${label}
      <p>
        <textarea
          type="${input.type}"
          name="${input.name}"
          id="${input.id}"
          cols="${input.cols || 5}"
          rows="${input.rows || 5}"
          ${inputDisabled}
        />${input.value}</textarea>
      </p>
    `;
  }

  if (input.type === 'select') {
    const options = (input.options || [])
      .map(option => {
        const optionSelected = input.value === option.value ? 'selected' : '';
        const optionDisabled = option.disabled ? 'disabled' : '';
        return `<option
          value="${option.value || ''}"
          ${optionSelected}
          ${optionDisabled}
        >
          ${option.name || option.value || ''}
        </option>`;
      })
      .join('');
    return `
      ${label}
      <p>
        <select
          type="${input.type}"
          name="${input.name}"
          id="${input.id}"
          value="${input.value}"
          ${inputDisabled}
        />${options}</select>
      </p>
    `;
  }

  return `
    ${label}
    <p>
      <input
        type="${input.type}"
        name="${input.name}"
        id="${input.id}"
        placeholder="${input.placeholder}"
        value="${input.value}"
        maxlength="${input.maxLength}"
        ${inputDisabled}
      />
    </p>
  `;
}

/**
 * Given inputs and validations, validate entered input, and return aggregated data.
 *
 * @param {object[]} options.inputs
 * @param {object[]} options.validations
 * @returns {func}
 */
function getResultsAfterValidations({ inputs = [], validations = [] } = {}) {
  return result => {
    return new Promise((resolve, reject) => {
      sweetalert2.resetValidationError();
      let errors = [];
      for (let i = 0; i < validations.length; i++) {
        const validation = validations[i];
        const input = document.getElementById(validation.id);
        if (!input) {
          errors.push(`Field ${validation.name || ''} must not be empty.\r\n`);
        } else if (!validation.validate(input)) {
          errors.push(validation.messageOnFail);
        }
      }
      if (errors.length) {
        const errorsString = errors.join('');
        sweetalert2.showValidationError(errorsString);
        return resolve(result);
      }
      let returnData = {};
      inputs.map(input => {
        const domInput = document.getElementById(input.id);
        const inputValue =
          input.formatValue && typeof input.formatValue === 'function'
            ? input.formatValue(domInput.value)
            : domInput.value;
        returnData[input.fieldName || input.name] = inputValue;
      });
      return resolve(returnData);
    });
  };
}
