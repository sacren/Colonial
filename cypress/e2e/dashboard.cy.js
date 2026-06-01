describe('Authenticated dashboard', () => {
  it('renders the dashboard for a logged-in user and signs out', () => {
    // Seed + authenticate via the test-only route. The server factory-creates a
    // verified user and logs them in; Cypress captures the session cookie from
    // the response and carries it into the next visit.
    cy.request('POST', '/testing/login')

    cy.visit('/dashboard')

    // The authenticated app shell renders.
    cy.url().should('include', '/dashboard')
    cy.get('[data-test=sidebar-menu-button]').should('be.visible')

    // Sign out through the UI. The layout renders a logout control in both the
    // desktop and mobile menus, so open the user menu and click the visible one.
    cy.get('[data-test=sidebar-menu-button]').click()
    cy.get('[data-test=logout-button]:visible').click()

    // Logout redirects to the welcome page; the user is no longer authenticated.
    cy.location('pathname').should('eq', '/')
  })
})
