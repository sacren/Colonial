describe('Profile update', () => {
  it('saves the profile and waits on the real Livewire update round-trip', () => {
    // Spy on Livewire's update endpoint. Livewire 4 mounts it under an
    // app-specific, randomized prefix (e.g. /livewire-ed665f5d/update), so we
    // match the stable shape with a regex rather than hard-coding the prefix —
    // which would silently break if it ever rotates.
    cy.intercept('POST', /\/livewire-[0-9a-f]+\/update$/).as('livewireUpdate')

    cy.login()
    cy.visit('/settings/profile')

    // Flux forwards wire:model onto the underlying <input>, so the binding name
    // is a stable selector here (the field carries no name/data-test attribute).
    cy.get('input[wire\\:model=name]').clear()
    cy.get('input[wire\\:model=name]').type('Renamed User')
    cy.get('[data-test=update-profile-button]').click()

    // Synchronize on the actual network response instead of an arbitrary wait:
    // the save is only proven once Livewire's update returns 200. This is the
    // point of the intercept — a deterministic gate, not a fixed sleep.
    cy.wait('@livewireUpdate').its('response.statusCode').should('eq', 200)

    // The user-observable success: Flux's success toast.
    cy.contains('Profile updated.').should('be.visible')
  })
})
