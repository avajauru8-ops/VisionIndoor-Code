<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */

// --- API Routes ---
$routes->group('api', ['filter' => 'cors'], static function ($routes) {
    
    // API Pública (TV)
    $routes->get('playlists', 'Api::getPlaylist');
    $routes->get('loteria', 'Api::loteria');

    // Autenticação
    $routes->post('auth/login', 'Auth::login');

    // Admin Users (CRUD)
    $routes->group('admin/users', ['filter' => 'auth:admin'], static function ($routes) {
        $routes->get('/', 'Users::index');
        $routes->get('', 'Users::index');
        $routes->post('', 'Users::create');
        $routes->put('(:segment)/license', 'Users::updateLicense/$1');
        $routes->put('(:segment)', 'Users::update/$1');
        $routes->delete('(:segment)', 'Users::delete/$1');
    });

    // Admin Settings
    $routes->group('admin/settings', ['filter' => 'auth:admin'], static function ($routes) {
        $routes->get('/', 'Settings::index');
        $routes->get('', 'Settings::index');
        $routes->post('', 'Settings::update'); // CodeIgniter prefers POST for file uploads
    });

    // Totems
    $routes->group('totems', ['filter' => 'auth'], static function ($routes) {
        $routes->get('/', 'Totems::index');
        $routes->get('', 'Totems::index');
        $routes->post('', 'Totems::create');
        $routes->put('(:segment)', 'Totems::update/$1');
        $routes->delete('(:segment)', 'Totems::delete/$1');
    });

    // Playlists
    $routes->group('playlists', ['filter' => 'auth'], static function ($routes) {
        $routes->get('/', 'Playlists::index');
        $routes->get('', 'Playlists::index');
        $routes->post('', 'Playlists::create'); // multipart/form-data
        $routes->post('(:segment)', 'Playlists::update/$1'); // CI4 multipart limit - use POST to simulate PUT
        $routes->put('(:segment)', 'Playlists::update/$1'); // Adicionado PUT route!
        $routes->delete('(:segment)', 'Playlists::delete/$1');
    });

    $routes->get('config', 'Api::config');
    $routes->post('blob/upload', 'Api::blobUpload');
});

// App Android Routes
$routes->get('api.php', 'Api::getPlaylist', ['filter' => 'cors']);
$routes->get('api/get_playlist.php', 'Api::getPlaylist', ['filter' => 'cors']);
$routes->post('api.php', 'Api::getPlaylist', ['filter' => 'cors']);
$routes->post('api/get_playlist.php', 'Api::getPlaylist', ['filter' => 'cors']);

// --- Frontend (React) ---
// MUST BE AT THE BOTTOM! Routes are processed top-to-bottom.
$routes->get('(:any)', 'React::index', ['filter' => 'cors']);
$routes->get('/', 'React::index');
