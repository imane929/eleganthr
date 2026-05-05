<?php

use Illuminate\Support\Facades\Route;

// Route unique pour SPA (React) - exclure les routes API
Route::get('/{any}', function () {
    return view('app'); // Vue qui charge React
})->where('any', '^(?!api).*$');