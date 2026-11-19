const { t, apply, url } = window.siteLocale;
const variant = new URLSearchParams(location.search).get('path') === 'direct' ? 'direct' : 'guided';
const topics = {
  steps: ['How the process works', 'You’d open a private intake, share the details the care team requests, and wait for a response about the next step.'],
  availability: ['Timing and availability', 'Availability depends on the service. Starting an intake would begin a request. It would not reserve an appointment or guarantee a response time.'],
  team: ['Who reviews the request', 'The service would tell you which team reviews your intake and how to contact them before you share personal information.'],
};
const hero = document.querySelector('.hero');
const flow = document.querySelector('#flow');
const stage = document.querySelector('#stage');
const stepLabel = document.querySelector('#step');
const begin = document.querySelector('#begin');
const overview = document.querySelector('#return');
const events = document.querySelector('#events');
let selection = '';

function track(name, detail = '') {
  const item = document.createElement('li');
  item.textContent = t(variant) + ' / ' + t(name) + (detail ? ' / ' + t(detail) : '');
  events.append(item);
}

function showStep(step, markup, progress) {
  hero.hidden = true;
  flow.hidden = false;
  flow.dataset.progress = progress;
  stepLabel.textContent = t(step);
  stage.innerHTML = '<div>' + markup + '</div>';
  apply(stage);
  stage.querySelector('h2').focus();
}

function showTopic() {
  showStep('Step 1 of 2', `
    <h2 tabindex="-1">What would you like to know first?</h2>
    <form>
      <fieldset><legend>Choose one topic</legend>
        ${Object.entries(topics).map(([key, [label]]) => `
          <label class="choice"><input type="radio" name="topic" value="${key}" required ${selection === key ? 'checked' : ''}> ${label}</label>
        `).join('')}
      </fieldset>
      <button class="button">Show my overview</button>
    </form>`, 1);
  stage.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    selection = new FormData(event.currentTarget).get('topic');
    track('topic_selected', selection);
    showOverview();
  });
}

function showOverview() {
  const [title, summary] = topics[selection];
  showStep('Step 2 of 2', `
    <h2 tabindex="-1">${title}</h2>
    <p>${summary}</p>
    <div class="stage-actions">
      <button class="button" type="button">Start consultation</button>
      <button class="quiet" type="button">Choose another topic</button>
    </div>`, 2);
  track('tailored_overview_view');
  stage.querySelector('.button').addEventListener('click', showIntake);
  stage.querySelector('.quiet').addEventListener('click', showTopic);
}

function showIntake() {
  track('consultation_start');
  showStep('Consultation intake preview', `
    <h2 tabindex="-1">You’ve reached the intake</h2>
    <p>A live intake would ask for contact information and other details needed to review your request. This prototype skips those fields.</p>
    <button class="button" type="button">Finish demo</button>`, 3);
  stage.querySelector('.button').addEventListener('click', () => {
    track('demo_complete');
    showStep('Demo complete', `
      <h2 tabindex="-1">Preview complete</h2>
      <p>No consultation was requested and no personal information was collected.</p>`, 3);
  });
}

if (variant === 'direct') {
  document.querySelector('#hero-title').textContent = 'Start an online consultation.';
  document.querySelector('#offer-copy').textContent = 'Open the intake preview to see where a consultation request would begin.';
  document.querySelector('#variant-label').textContent = 'You’re viewing the direct version.';
  const link = document.querySelector('#variant-link');
  link.href = url('./');
  link.textContent = 'Open the guided version';
  begin.textContent = 'Start consultation';
}
begin.addEventListener('click', () => {
  if (variant === 'direct') {
    showIntake();
  } else {
    track('guidance_start');
    showTopic();
  }
});
overview.addEventListener('click', () => {
  flow.hidden = true;
  hero.hidden = false;
  begin.focus();
});
track('landing_view');
begin.hidden = false;