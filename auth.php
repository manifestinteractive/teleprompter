<?php

// Pusher requires using "Private Channels" in order to allow clients to send commands.
// This requires a tiny bit of code that can sign requests for "authenticated" users.
// We're treating every client as an authenticated user and signing everything blindly.
// This effectively makes them public channels again.
// https://pusher.com/docs/channels/using_channels/private-channels

ob_start();
require(__DIR__.'/js/pusher.php');
ob_end_clean();

$auth = hash_hmac('sha256', $_POST['socket_id'].':'.$_POST['channel_name'], $secret);

header('Content-type: application/json');
echo json_encode([
	'auth' => $key.':'.$auth
]);
