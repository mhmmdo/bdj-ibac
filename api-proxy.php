<?php
/**
 * Puan AI Assistant CORS Proxy
 * Bypasses browser CORS restrictions by routing requests server-to-server.
 */

// Suppress ALL PHP errors/warnings from polluting the JSON output
error_reporting(0);
ini_set('display_errors', 0);

// Start output buffer — captures any stray warnings/notices
ob_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json");

// Handle preflight OPTIONS request immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    exit(0);
}

// Read raw JSON post body from browser
$input = file_get_contents('php://input');

if (!$input) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(["error" => "Empty request body"]);
    exit;
}

// Initialize cURL to forward request server-to-server (no CORS restriction here)
$ch = curl_init('https://9router.simpelnya.web.id/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer sk-5226ce097176b8fc-dq6n3t-b6af3a79'
]);

// Execute cURL
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// Discard any buffered PHP warnings/notices — only output clean JSON
ob_end_clean();

if ($curlError) {
    http_response_code(500);
    echo json_encode(["error" => "Proxy cURL Error: " . $curlError]);
} else {
    http_response_code($httpCode);
    echo $response;
}
