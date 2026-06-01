<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Testing Routes
|--------------------------------------------------------------------------
|
| Test-only support routes for the Cypress E2E suite. This file is registered
| from bootstrap/app.php ONLY when the app is not in production, so these
| routes do not exist in a production deployment. The in-handler guard below
| is a second, independent safeguard.
|
*/

Route::post('/testing/login', function () {
    abort_unless(app()->environment('local', 'testing'), 404);

    $user = User::factory()->create();

    Auth::login($user);

    return response()->noContent();
});
