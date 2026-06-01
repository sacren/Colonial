// ***********************************************
// Custom commands for the E2E suite.
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Authenticate as a fresh, verified user.
 *
 * Wraps the env-gated `POST /testing/login` server route (see routes/testing.php).
 * The server factory-creates a verified user and logs them in; the session cookie
 * rides back on the response and Cypress carries it into the next `cy.visit`.
 *
 * Cypress runs on the desktop while the app and DB run on the server, so seeding
 * goes over HTTP rather than through `cy.task()`, which can't reach the server DB.
 */
Cypress.Commands.add('login', () => {
  cy.request('POST', '/testing/login')
})
