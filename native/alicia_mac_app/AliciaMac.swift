import SwiftUI
import AppKit
import AVFoundation
import Network
import Combine

// Alicia pour les Mac Intel sous macOS Big Sur 11 et versions ulterieures.
// Prototype hors navigateur. La conversation IA n'est pas encore connectee.
@main
struct AliciaMacApp: App {
    var body: some Scene {
        WindowGroup("Alicia") {
            AliciaMainView()
                .frame(minWidth: 790, minHeight: 620)
        }
    }
}

final class AliciaVoice: ObservableObject {
    private let synth = AVSpeechSynthesizer()
    func say(_ text: String) {
        synth.stopSpeaking(at: .immediate)
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "fr-FR")
        utterance.rate = 0.48
        utterance.pitchMultiplier = 1.04
        synth.speak(utterance)
    }
}

final class AliciaConnection: ObservableObject {
    @Published var label = "Verification du reseau..."
    @Published var usable = false
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "fr.alicia.mac.network")
    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            let name: String
            if path.status != .satisfied {
                name = "Deconnecte"
            } else if path.usesInterfaceType(.wifi) {
                name = "Wi-Fi"
            } else if path.usesInterfaceType(.wiredEthernet) {
                name = "Ethernet"
            } else {
                name = "Reseau local / autre"
            }
            DispatchQueue.main.async {
                self?.label = name
                self?.usable = path.status == .satisfied
            }
        }
        monitor.start(queue: queue)
    }
    deinit { monitor.cancel() }
}

struct AliciaChatMessage: Identifiable {
    let id = UUID()
    let text: String
    let fromUser: Bool
}

struct AliciaMainView: View {
    @StateObject private var voice = AliciaVoice()
    @StateObject private var net = AliciaConnection()
    @State private var typed = ""
    @State private var mode = "General"
    @State private var selectedVoice = "Douce"
    @State private var messages: [AliciaChatMessage] = [
        AliciaChatMessage(
            text: "Bonjour ! Je suis Alicia sur ton Mac. Mon interface et ma voix fonctionnent localement. Le moteur de conversation IA n'est pas encore connecte.",
            fromUser: false)
    ]
    @State private var altServerVisible = false
    @State private var notice = ""
    private let bg = Color(red: 0.035, green: 0.065, blue: 0.16)
    private let panel = Color(red: 0.10, green: 0.16, blue: 0.32)
    private let blue = Color(red: 0.57, green: 0.79, blue: 1.0)

    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [bg, Color(red: 0.06, green: 0.11, blue: 0.24)]),
                startPoint: .topLeading, endPoint: .bottomTrailing
            ).ignoresSafeArea()
            VStack(spacing: 0) {
                header
                ScrollView {
                    VStack(spacing: 15) {
                        topRow
                        HStack(alignment: .top, spacing: 15) {
                            voiceCard
                            expressionsCard
                        }
                        modesCard
                        chatCard
                        footer
                    }
                    .padding(19)
                }
                sendBar
            }
        }
        .foregroundColor(.white)
        .onAppear(perform: refreshAltServer)
    }

    private var header: some View {
        HStack(spacing: 13) {
            Image(systemName: "sparkles")
                .font(.system(size: 27, weight: .semibold))
                .foregroundColor(blue)
                .frame(width: 49, height: 49)
                .background(Color(red: 0.18, green: 0.23, blue: 0.49))
                .cornerRadius(13)
            VStack(alignment: .leading, spacing: 3) {
                Text("ALICIA").font(.system(size: 25, weight: .semibold, design: .rounded))
                    .tracking(3).foregroundColor(blue)
                Text("Assistant · Code · Diagnostic · Création")
                    .font(.caption).foregroundColor(.white.opacity(0.75))
            }
            Spacer()
            Label(net.label, systemImage: net.usable ? "wifi" : "wifi.slash")
                .font(.subheadline)
                .foregroundColor(net.usable ? .green : .yellow)
            Text("Natif Mac · Big Sur")
                .font(.caption)
                .padding(9)
                .background(panel)
                .cornerRadius(9)
        }
        .padding(.horizontal, 20).padding(.vertical, 13)
        .background(Color(red: 0.05, green: 0.08, blue: 0.19))
    }

    private var topRow: some View {
        HStack(alignment: .top, spacing: 15) {
            card {
                HStack(spacing: 14) {
                    if let portrait = portraitImage {
                        Image(nsImage: portrait)
                            .resizable().scaledToFill()
                            .frame(width: 182, height: 210).clipped()
                            .cornerRadius(12)
                    } else {
                        Image(systemName: "person.crop.circle.fill")
                            .font(.system(size: 97))
                            .frame(width: 182, height: 210)
                            .foregroundColor(blue)
                    }
                    VStack(alignment: .leading, spacing: 11) {
                        Label("Alicia est prête", systemImage: "circle.fill")
                            .font(.headline)
                            .foregroundColor(.green)
                        Text("Ton assistante personnelle sur Mac.")
                            .font(.title3).bold()
                        Text("Interface locale, voix française, outils et suivi du compagnon iPhone.")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.8))
                        Text("Version native de démonstration")
                            .font(.caption).foregroundColor(blue)
                    }
                    Spacer(minLength: 0)
                }
            }
            card {
                VStack(alignment: .leading, spacing: 10) {
                    Label("AltServer sur ce Mac", systemImage: "desktopcomputer")
                        .font(.headline).foregroundColor(blue)
                    Text(altServerVisible ? "AltServer détecté" : "AltServer non détecté")
                        .foregroundColor(altServerVisible ? .green : .orange)
                    Text("Le renouvellement de l'iPhone est assuré par AltStore et AltServer ; pas par Alicia.")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.76))
                    Button("Vérifier AltServer", action: refreshAltServer)
                    Text("L'application Mac n'expire pas après 7 jours.")
                        .font(.caption).foregroundColor(blue)
                }
            }
            .frame(width: 245)
        }
    }

    private var portraitImage: NSImage? {
        guard let path = Bundle.main.path(forResource: "AliciaPortrait", ofType: "png") else { return nil }
        return NSImage(contentsOfFile: path)
    }

    private var voiceCard: some View {
        card {
            VStack(alignment: .leading, spacing: 13) {
                Label("Voix d'Alicia", systemImage: "speaker.wave.2")
                    .font(.headline).foregroundColor(blue)
                Text("Synthèse vocale française sur le Mac")
                    .font(.subheadline)
                Picker("Style", selection: $selectedVoice) {
                    ForEach(["Douce", "Naturelle", "Dynamique"], id: \.self) { choice in
                        Text(choice).tag(choice)
                    }
                }
                .pickerStyle(PopUpButtonPickerStyle())
                Button("Écouter Alicia") {
                    voice.say("Bonjour ! Je suis Alicia, ton assistante personnelle sur Mac.")
                }
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var expressionsCard: some View {
        card {
            VStack(alignment: .leading, spacing: 12) {
                Label("Expressions vocales", systemImage: "face.smiling")
                    .font(.headline).foregroundColor(blue)
                Text("Démonstrations vocales (pas de vraies émotions)")
                    .font(.caption).foregroundColor(.white.opacity(0.75))
                HStack {
                    emotion("Rire", text: "Ha ha ha !", icon: "face.smiling")
                    emotion("Tristesse", text: "Je prends une voix triste.", icon: "cloud.rain")
                    emotion("Peur", text: "Oh, quelle surprise !", icon: "exclamationmark.triangle")
                    emotion("Colère", text: "Je parle avec fermeté.", icon: "bolt")
                }
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func emotion(_ name: String, text: String, icon: String) -> some View {
        Button(action: { voice.say(text) }) {
            VStack(spacing: 7) {
                Image(systemName: icon)
                Text(name).font(.caption)
            }
            .frame(maxWidth: .infinity, minHeight: 55)
        }
        .buttonStyle(PlainButtonStyle())
        .padding(8)
        .background(Color(red: 0.18, green: 0.24, blue: 0.43))
        .cornerRadius(10)
    }

    private var modesCard: some View {
        card {
            VStack(alignment: .leading, spacing: 12) {
                Label("Mode d'expertise", systemImage: "square.grid.2x2")
                    .font(.headline).foregroundColor(blue)
                HStack(spacing: 9) {
                    ForEach(["General", "Code", "Reparation", "Creation", "Professeur"], id: \.self) { choice in
                        Button(choice) { mode = choice }
                            .buttonStyle(PlainButtonStyle())
                            .padding(.horizontal, 14).padding(.vertical, 9)
                            .background(mode == choice ? blue : Color(red: 0.19, green: 0.25, blue: 0.44))
                            .foregroundColor(mode == choice ? bg : .white)
                            .cornerRadius(14)
                    }
                }
                Text("Mode sélectionné : \(mode). Le moteur spécialisé sera connecté ultérieurement.")
                    .font(.caption).foregroundColor(.white.opacity(0.75))
            }
        }
    }

    private var chatCard: some View {
        card {
            VStack(alignment: .leading, spacing: 11) {
                HStack {
                    Label("Conversation", systemImage: "bubble.left.and.bubble.right")
                        .font(.headline).foregroundColor(blue)
                    Spacer()
                    Button("Effacer") { messages.removeAll() }
                }
                ScrollView {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(messages) { entry in
                            HStack {
                                if entry.fromUser { Spacer(minLength: 90) }
                                Text(entry.text)
                                    .font(.subheadline)
                                    .padding(11)
                                    .background(entry.fromUser
                                        ? Color(red: 0.22, green: 0.29, blue: 0.62)
                                        : Color(red: 0.17, green: 0.22, blue: 0.39))
                                    .cornerRadius(12)
                                if !entry.fromUser { Spacer(minLength: 90) }
                            }
                        }
                    }
                }.frame(height: 150)
            }
        }
    }

    private var sendBar: some View {
        HStack(spacing: 11) {
            TextField("Écris à Alicia...", text: $typed, onCommit: sendMessage)
                .textFieldStyle(RoundedBorderTextFieldStyle())
            Button("Envoyer", action: sendMessage)
                .disabled(typed.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .padding(15)
        .background(Color(red: 0.07, green: 0.11, blue: 0.24))
    }

    private var footer: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Alicia Mac v0.1 · Gratuit · Aucune connexion ChatGPT requise pour cette interface")
            Text("Limites : pas encore de moteur IA, de dictée, d'avatar 3D ou de synchronisation iPhone/Mac.")
        }
        .font(.caption)
        .foregroundColor(.white.opacity(0.70))
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func sendMessage() {
        let text = typed.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        messages.append(AliciaChatMessage(text: text, fromUser: true))
        messages.append(AliciaChatMessage(
            text: "Message reçu. Cette version Mac n'est pas encore connectée au moteur IA ; je n'invente pas de réponse.",
            fromUser: false
        ))
        typed = ""
    }

    private func refreshAltServer() {
        altServerVisible = NSWorkspace.shared.runningApplications.contains {
            ($0.localizedName ?? "").localizedCaseInsensitiveContains("AltServer")
            || ($0.bundleIdentifier ?? "").localizedCaseInsensitiveContains("altserver")
        }
    }

    private func card<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(panel)
            .cornerRadius(17)
            .overlay(
                RoundedRectangle(cornerRadius: 17)
                    .stroke(Color(red: 0.27, green: 0.39, blue: 0.63), lineWidth: 1)
            )
    }
}
