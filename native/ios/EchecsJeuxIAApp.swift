import SwiftUI
import WebKit

@main
struct EchecsJeuxIAApp: App {
    var body: some Scene {
        WindowGroup { GameHomeView() }
    }
}

struct GameHomeView: View {
    @State private var selected = 0
    private let tabs = ["Jeux", "Coach IA", "Réglages"]
    var body: some View {
        TabView(selection: $selected) {
            GameLibraryView()
                .tabItem { Label("Jeux", systemImage: "gamecontroller") }.tag(0)
            GameCoachView()
                .tabItem { Label("Coach IA", systemImage: "brain.head.profile") }.tag(1)
            SettingsView()
                .tabItem { Label("Réglages", systemImage: "gearshape") }.tag(2)
        }
        .tint(.teal)
    }
}

struct GameLibraryView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Jeux disponibles") {
                    NavigationLink {
                        ExistingGamesView()
                    } label: {
                        Label("Échecs, Go, Shogi et entraînements", systemImage: "checkerboard.rectangle")
                    }
                }
                Section("Installation native") {
                    Text("Cette interface est native SwiftUI. Les jeux existants restent intégrés dans une vue WebKit tant qu'ils ne sont pas réécrits en Swift.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
            .navigationTitle("ÉCHECS & JEUX IA")
        }
    }
}

struct ExistingGamesView: View {
    var body: some View {
        GameWebView(url: URL(string: "https://davidderetour-ai.github.io/echecs-jeux-ia/")!)
            .navigationTitle("Mes jeux")
            .navigationBarTitleDisplayMode(.inline)
    }
}

struct GameWebView: UIViewRepresentable {
    let url: URL
    func makeUIView(context: Context) -> WKWebView {
        let view = WKWebView()
        view.load(URLRequest(url: url))
        return view
    }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

struct GameCoachView: View {
    @State private var question = ""
    @State private var answer = "Bonjour ! Je suis ton coach de jeux. Demande-moi une règle ou un conseil."
    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 20) {
                Label("Coach de jeux hors ligne", systemImage: "brain.head.profile")
                    .font(.title2.bold())
                Text(answer)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(.teal.opacity(0.12), in: RoundedRectangle(cornerRadius: 16))
                TextField("Ex. Comment jouer au Go ?", text: $question)
                    .textFieldStyle(.roundedBorder)
                    .onSubmit(ask)
                Button("Demander au coach", action: ask)
                    .buttonStyle(.borderedProminent)
                    .disabled(question.trimmingCharacters(in: .whitespaces).isEmpty)
                Text("Prototype local : réponses pédagogiques préprogrammées, sans modèle IA génératif. Aucune donnée envoyée à un serveur.")
                    .font(.caption).foregroundStyle(.secondary)
                Spacer()
            }
            .padding()
            .navigationTitle("Assistant jeux")
        }
    }
    private func ask() {
        let q = question.lowercased()
        if q.contains("go") {
            answer = "Au Go, pose tes pierres sur les intersections. Entoure des territoires et capture les pierres sans liberté. Commence sur un plateau 9 × 9."
        } else if q.contains("shogi") {
            answer = "Au Shogi, tu peux remettre en jeu certaines pièces capturées. Le but est de mater le roi adverse."
        } else if q.contains("4") || q.contains("quatre") {
            answer = "Aux échecs à quatre, chaque joueur protège son roi. Observe les menaces venant de trois directions avant chaque coup."
        } else if q.contains("échec") || q.contains("echec") {
            answer = "Avant de jouer, vérifie les échecs, les captures et les menaces. Protège ton roi et développe tes pièces."
        } else {
            answer = "Je peux expliquer les échecs, les échecs à quatre, le Go et le Shogi. Pour une analyse réelle du plateau, il faudra connecter le moteur de jeu."
        }
    }
}

struct SettingsView: View {
    @AppStorage("showHints") private var showHints = true
    @AppStorage("compactClocks") private var compactClocks = true
    var body: some View {
        NavigationStack {
            Form {
                Toggle("Conseils activés", isOn: $showHints)
                Toggle("Pendules compactes (préférence)", isOn: $compactClocks)
                Text("Ces préférences natives ne sont pas encore synchronisées avec le moteur JavaScript des jeux.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            .navigationTitle("Réglages")
        }
    }
}
