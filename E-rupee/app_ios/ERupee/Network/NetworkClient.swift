import Foundation

// MARK: - Network Client (pure URLSession, no dependencies)

actor NetworkClient {
    static let shared = NetworkClient()

    // iOS Simulator → use 127.0.0.1 (runs on Mac)
    // Physical device → use Mac's WiFi IP (e.g. 10.20.51.185)
    private let baseURL = "http://127.0.0.1:8000/"

    private let session: URLSession
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 30
        // Bypass iCloud Private Relay / system proxy for local network requests
        config.connectionProxyDictionary = [:]
        session = URLSession(configuration: config)
        encoder = JSONEncoder()
        decoder = JSONDecoder()
    }

    // MARK: - Generic request helpers

    func get<T: Decodable>(_ path: String) async throws -> T {
        guard let url = URL(string: baseURL + path) else {
            throw NetworkError.invalidURL
        }
        let (data, response) = try await session.data(from: url)
        try validateResponse(response)
        return try decoder.decode(T.self, from: data)
    }

    func post<B: Encodable, T: Decodable>(_ path: String, body: B) async throws -> T {
        guard let url = URL(string: baseURL + path) else {
            throw NetworkError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        return try decoder.decode(T.self, from: data)
    }

    private func validateResponse(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        guard (200...299).contains(http.statusCode) else {
            throw NetworkError.httpError(http.statusCode)
        }
    }
}

// MARK: - Errors

enum NetworkError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(Int)
    case decodingError(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .invalidResponse: return "Invalid server response"
        case .httpError(let code): return "HTTP error \(code)"
        case .decodingError(let msg): return "Decoding error: \(msg)"
        }
    }
}
