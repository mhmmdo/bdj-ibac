<?php
/**
 * Puan AI Assistant CORS Proxy
 * Bypasses browser CORS restrictions by routing requests server-to-server.
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json");

// Handle preflight options request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Read raw JSON post body
$input = file_get_contents('php://input');

// Initialize Curl request to the actual OpenAI-compatible router
$ch = curl_init('https://9router.simpelnya.web.id/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer sk-5226ce097176b8fc-dq6n3t-b6af3a79'
]);

// Execute curl
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    $error_msg = curl_error($ch);
    http_response_code(500);
    echo json_encode(["error" => "Proxy Error: " . $error_msg]);
} else {
    http_response_code($httpCode);
    echo $response;
}

curl_close($ch);
