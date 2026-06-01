describe('Authenticated dashboard', () => {
  it('renders the dashboard for a logged-in user and signs out', () => {
    // Force a desktop viewport. Cypress's default is 1000px wide, just below
    // Tailwind's lg breakpoint (1024px), where the app collapses the sidebar
    // off-canvas and [data-test=sidebar-menu-button] is unreachable.
    cy.viewport(1280, 800)

    // Seed + authenticate via the test-only route. The server factory-creates a
    // verified user and logs them in; Cypress captures the session cookie from
    // the response and carries it into the next visit.
    cy.request('POST', '/testing/login')

    cy.visit('/dashboard')

    // The authenticated app shell rendered.
    cy.url().should('include', '/dashboard')
    cy.contains('Platform').should('be.visible')

    // Sign out through the user menu, now rendered at desktop width. The layout
    // renders a logout control in both the desktop and mobile menus, so click
    // the visible one.
    cy.get('[data-test=sidebar-menu-button]').click()
    cy.get('[data-test=logout-button]:visible').click()

    // Logout redirects to the welcome page; the user is no longer authenticated.
    cy.location('pathname').should('eq', '/')
  })
})
