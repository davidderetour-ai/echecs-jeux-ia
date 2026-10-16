import SwiftUI
import AppKit
import AVFoundation
import Network
import Combine

// Alicia Mac V0.2 — application Intel autonome pour macOS Big Sur 11.0+
// Prototype graphique : moteur IA et dictee non encore connectes.
@main
struct AliciaV02App: App {
    var body: some Scene {
        WindowGroup("Alicia V0.2") {
            AliciaV02View()
                .frame(minWidth: 800, minHeight: 690)
        }
    }
}

private enum AliciaStyle {
    static let navy = Color(red: 0.026, green: 0.045, blue: 0.135)
    static let panel = Color(red: 0.075, green: 0.115, blue: 0.27)
    static let panelLight = Color(red: 0.095, green: 0.15, blue: 0.34)
    static let sky = Color(red: 0.47, green: 0.82, blue: 1.0)
    static let violet = Color(red: 0.70, green: 0.33, blue: 0.99)
    static let faded = Color(red: 0.72, green: 0.79, blue: 0.95)
    static let line = Color(red: 0.33, green: 0.42, blue: 0.86)
    static var glow: LinearGradient {
        LinearGradient(gradient: Gradient(colors: [sky, Color(red: 0.33, green: 0.39, blue: 0.98), violet]),
                       startPoint: .leading, endPoint: .trailing)
    }
}

private struct AliciaMessage: Identifiable {
    let id = UUID()
    let user: Bool
    let text: String
    let demonstration: Bool
}

private final class AliciaMacVoice: ObservableObject {
    private let synthesizer = AVSpeechSynthesizer()
    func speak(_ words: String, style: String) {
        synthesizer.stopSpeaking(at: .immediate)
        let utterance = AVSpeechUtterance(string: words)
        utterance.voice = AVSpeechSynthesisVoice(language: "fr-FR")
        switch style {
        case "Douce":
            utterance.rate = 0.43
            utterance.pitchMultiplier = 1.08
        case "Dynamique":
            utterance.rate = 0.57
            utterance.pitchMultiplier = 1.12
        default:
            utterance.rate = 0.50
            utterance.pitchMultiplier = 1.0
        }
        synthesizer.speak(utterance)
    }
}

private final class AliciaMacNetwork: ObservableObject {
    @Published var label = "Réseau à vérifier"
    @Published var connected = false
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "fr.alicia.v02.network")
    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            let name: String
            if path.status != .satisfied { name = "Déconnecté" }
            else if path.usesInterfaceType(.wifi) { name = "Wi-Fi" }
            else if path.usesInterfaceType(.wiredEthernet) { name = "Ethernet" }
            else { name = "Autre réseau" }
            DispatchQueue.main.async {
                self?.label = name
                self?.connected = path.status == .satisfied
            }
        }
        monitor.start(queue: queue)
    }
    deinit { monitor.cancel() }
}

struct AliciaV02View: View {
    @StateObject private var voice = AliciaMacVoice()
    @StateObject private var network = AliciaMacNetwork()
    @State private var mode = "Général"
    @State private var voiceStyle = "Douce"
    @State private var input = ""
    @State private var showSettings = false
    @State private var showHelp = false
    @State private var altServerActive = false
    @State private var messages: [AliciaMessage] = [
        AliciaMessage(user: true,
                      text: "Peux-tu m’expliquer simplement comment fonctionne une batterie lithium ?",
                      demonstration: true),
        AliciaMessage(user: false,
                      text: "Exemple de réponse : une batterie lithium stocke de l’énergie grâce aux déplacements d’ions entre deux électrodes. Lors de la décharge, ces déplacements accompagnent la circulation d’électrons dans le circuit externe.",
                      demonstration: true)
    ]

    var body: some View {
        ZStack {
            LinearGradient(gradient: Gradient(colors: [AliciaStyle.navy,
                Color(red: 0.035, green: 0.07, blue: 0.19), AliciaStyle.navy]),
                startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            VStack(spacing: 0) {
                header
                ScrollView {
                    VStack(spacing: 14) {
                        hero
                        HStack(alignment: .top, spacing: 14) {
                            voicePanel.frame(maxWidth: .infinity)
                            emotionPanel.frame(maxWidth: .infinity)
                        }
                        expertisePanel
                        conversationPanel
                        Text("Alicia V0.2 · Version native de démonstration · IA conversationnelle non encore connectée")
                            .font(.system(size: 11))
                            .foregroundColor(AliciaStyle.faded)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(18)
                }
                messageComposer
            }
        }
        .foregroundColor(.white)
        .onAppear(perform: refreshAltServer)
        .sheet(isPresented: $showSettings) {
            settings
        }
        .alert(isPresented: $showHelp) {
            Alert(title: Text("Dictée vocale à venir"),
                  message: Text("Le microphone n’est pas encore connecté dans cette version. La voix de synthèse fonctionne déjà."),
                  dismissButton: .default(Text("D’accord")))
        }
    }

    private var header: some View {
        HStack(spacing: 13) {
            ZStack {
                RoundedRectangle(cornerRadius: 17).fill(AliciaStyle.glow)
                    .shadow(color: AliciaStyle.violet.opacity(0.6), radius: 13)
                Image(systemName: "sparkles")
                    .font(.system(size: 29, weight: .light))
                    .foregroundColor(.white)
            }
            .frame(width: 56, height: 56)
            VStack(alignment: .leading, spacing: 3) {
                Text("ALICIA")
                    .font(.system(size: 28, weight: .light, design: .rounded))
                    .tracking(5)
                    .foregroundColor(AliciaStyle.sky)
                Text("Assistant · Code · Diagnostic · Création")
                    .font(.system(size: 11))
                    .foregroundColor(AliciaStyle.faded)
            }
            Spacer()
            Label(network.label, systemImage: network.connected ? "wifi" : "wifi.slash")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(network.connected ? .green : .yellow)
            iconButton("gearshape", action: { showSettings = true })
        }
        .padding(.horizontal, 21)
        .padding(.vertical, 13)
        .background(AliciaStyle.navy)
    }

    private func iconButton(_ name: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: name)
                .font(.system(size: 20, weight: .medium))
                .foregroundColor(AliciaStyle.faded)
                .frame(width: 43, height: 43)
                .background(Circle().fill(AliciaStyle.panelLight))
                .overlay(Circle().stroke(AliciaStyle.line.opacity(0.6), lineWidth: 1))
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var hero: some View {
        surface {
            HStack(spacing: 17) {
                ZStack(alignment: .bottomTrailing) {
                    if let portrait = loadPortrait() {
                        Image(nsImage: portrait)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 290, height: 241)
                            .clipped()
                            .cornerRadius(16)
                            .overlay(RoundedRectangle(cornerRadius: 16)
                                .stroke(AliciaStyle.sky.opacity(0.65), lineWidth: 1.5))
                    } else {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(LinearGradient(gradient: Gradient(colors: [
                                Color(red: 0.18, green: 0.24, blue: 0.56),
                                Color(red: 0.39, green: 0.2, blue: 0.59)]),
                                startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 290, height: 241)
                            .overlay(Image(systemName: "person.crop.circle.fill")
                                .font(.system(size: 110))
                                .foregroundColor(AliciaStyle.sky))
                    }
                    Text("Alicia ♡")
                        .font(.system(size: 19, weight: .light, design: .rounded))
                        .italic()
                        .foregroundColor(AliciaStyle.sky)
                        .shadow(color: AliciaStyle.violet, radius: 6)
                        .padding(14)
                }
                VStack(alignment: .leading, spacing: 11) {
                    HStack(spacing: 9) {
                        Circle().fill(Color.green)
                            .frame(width: 11, height: 11)
                            .shadow(color: .green.opacity(0.9), radius: 6)
                        Text("Alicia est prête")
                            .font(.system(size: 19, weight: .bold))
                    }
                    Text("Toujours à vos côtés pour répondre, expliquer, créer et vous accompagner.")
                        .font(.system(size: 14))
                        .foregroundColor(AliciaStyle.faded)
                        .fixedSize(horizontal: false, vertical: true)
                    heroTag("✨", "Intelligente")
                    heroTag("♥", "Bienveillante")
                    heroTag("∞", "Toujours disponible")
                    Text("Moteur IA à connecter")
                        .font(.caption)
                        .foregroundColor(AliciaStyle.sky)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Spacer(minLength: 0)
            }
        }
    }

    private func loadPortrait() -> NSImage? {
        guard let path = Bundle.main.path(forResource: "AliciaPortrait", ofType: "jpg") else { return nil }
        return NSImage(contentsOfFile: path)
    }

    private func heroTag(_ symbol: String, _ label: String) -> some View {
        HStack(spacing: 7) {
            Text(symbol).foregroundColor(AliciaStyle.sky)
            Text(label)
        }
        .font(.system(size: 12))
        .padding(.horizontal, 12).padding(.vertical, 7)
        .background(Capsule().fill(AliciaStyle.panelLight))
        .overlay(Capsule().stroke(AliciaStyle.line.opacity(0.75), lineWidth: 1))
    }

    private var voicePanel: some View {
        surface {
            VStack(alignment: .leading, spacing: 11) {
                sectionTitle("mic", "Voix d’Alicia")
                Text("🇫🇷  Voix française")
                    .font(.system(size: 13))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .background(roundedInner)
                Text("Style de voix")
                    .font(.system(size: 11))
                    .foregroundColor(AliciaStyle.faded)
                Picker("Style de voix", selection: $voiceStyle) {
                    Text("Douce").tag("Douce")
                    Text("Naturelle").tag("Naturelle")
                    Text("Dynamique").tag("Dynamique")
                }
                .labelsHidden()
                .pickerStyle(PopUpButtonPickerStyle())
                .frame(maxWidth: .infinity)
                primaryButton("Écouter la voix d’Alicia", symbol: "play.circle.fill") {
                    voice.speak("Bonjour ! Je suis Alicia, ton assistante personnelle en français sur Mac.", style: voiceStyle)
                }
            }
        }
    }

    private var emotionPanel: some View {
        surface {
            VStack(alignment: .leading, spacing: 11) {
                sectionTitle("face.smiling", "Émotions")
                Text("Démonstrations vocales")
                    .font(.system(size: 11))
                    .foregroundColor(AliciaStyle.faded)
                HStack(spacing: 8) {
                    emotionButton("😂", "Rire", "Ha ha ha !")
                    emotionButton("😢", "Tristesse", "Je suis désolée.")
                }
                HStack(spacing: 8) {
                    emotionButton("😨", "Peur", "Oh ! Quelle surprise !")
                    emotionButton("😠", "Colère", "Je parle avec fermeté.")
                }
                Text("Les émotions sont simulées, pas ressenties.")
                    .font(.system(size: 10))
                    .foregroundColor(AliciaStyle.faded)
            }
        }
    }

    private func emotionButton(_ symbol: String, _ label: String, _ spoken: String) -> some View {
        Button(action: { voice.speak(spoken, style: voiceStyle) }) {
            VStack(spacing: 5) {
                Text(symbol).font(.system(size: 23))
                Text(label).font(.system(size: 11))
            }
            .frame(maxWidth: .infinity)
            .frame(height: 55)
            .background(roundedInner)
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var expertisePanel: some View {
        surface {
            VStack(alignment: .leading, spacing: 11) {
                sectionTitle("puzzlepiece.fill", "Mode d’expertise")
                HStack(spacing: 9) {
                    modeButton("Général", "house.fill")
                    modeButton("Code", "chevron.left.slash.chevron.right")
                    modeButton("Réparation", "wrench.fill")
                    modeButton("Création", "paintbrush.pointed.fill")
                    modeButton("Professeur", "graduationcap.fill")
                    Spacer(minLength: 0)
                }
                Text("Mode sélectionné : \(mode) · Moteur spécialisé à connecter.")
                    .font(.system(size: 11))
                    .foregroundColor(AliciaStyle.faded)
            }
        }
    }

    private func modeButton(_ title: String, _ icon: String) -> some View {
        Button(action: { mode = title }) {
            HStack(spacing: 6) {
                Image(systemName: icon).font(.system(size: 12))
                Text(title).font(.system(size: 12, weight: .medium))
            }
            .padding(.horizontal, 13)
            .padding(.vertical, 10)
            .foregroundColor(mode == title ? AliciaStyle.navy : AliciaStyle.faded)
            .background(Capsule().fill(mode == title ? AliciaStyle.sky : AliciaStyle.panelLight))
            .overlay(Capsule().stroke(AliciaStyle.line, lineWidth: 1))
            .shadow(color: mode == title ? AliciaStyle.sky.opacity(0.5) : .clear, radius: 7)
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var conversationPanel: some View {
        surface {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    sectionTitle("bubble.left.and.bubble.right", "Conversation")
                    Spacer()
                    Button(action: { messages.removeAll() }) {
                        Label("Effacer", systemImage: "trash")
                            .font(.system(size: 11))
                            .foregroundColor(AliciaStyle.faded)
                            .padding(.horizontal, 12).padding(.vertical, 7)
                            .background(Capsule().fill(AliciaStyle.panelLight))
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(messages) { message in
                            HStack(alignment: .bottom) {
                                if message.user { Spacer(minLength: 120) }
                                if !message.user { portraitBubble }
                                VStack(alignment: .leading, spacing: 5) {
                                    if message.demonstration {
                                        Text("DÉMONSTRATION")
                                            .font(.system(size: 9, weight: .bold))
                                            .foregroundColor(AliciaStyle.sky)
                                    }
                                    Text(message.text)
                                        .font(.system(size: 13))
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .padding(13)
                                .frame(maxWidth: 525, alignment: .leading)
                                .background(RoundedRectangle(cornerRadius: 16)
                                    .fill(message.user ? Color(red: 0.14, green: 0.19, blue: 0.48)
                                                       : AliciaStyle.panelLight))
                                .overlay(RoundedRectangle(cornerRadius: 16)
                                    .stroke(AliciaStyle.line.opacity(0.8), lineWidth: 1))
                                if !message.user { Spacer(minLength: 120) }
                            }
                        }
                    }
                }
                .frame(height: 190)
            }
        }
    }

    private var portraitBubble: some View {
        Group {
            if let img = loadPortrait() {
                Image(nsImage: img)
                    .resizable().scaledToFill()
                    .frame(width: 37, height: 37).clipShape(Circle())
            } else {
                Image(systemName: "person.crop.circle.fill")
                    .resizable().frame(width: 37, height: 37)
            }
        }
        .overlay(Circle().stroke(AliciaStyle.sky, lineWidth: 1))
    }

    private var messageComposer: some View {
        HStack(spacing: 12) {
            Button(action: { showHelp = true }) {
                Image(systemName: "mic.fill")
                    .font(.system(size: 18))
                    .frame(width: 42, height: 42)
                    .background(Circle().fill(AliciaStyle.panelLight))
                    .overlay(Circle().stroke(AliciaStyle.sky.opacity(0.7)))
            }
            .buttonStyle(PlainButtonStyle())
            TextField("Écrivez votre message à Alicia...", text: $input, onCommit: sendMessage)
                .textFieldStyle(PlainTextFieldStyle())
                .font(.system(size: 14))
                .foregroundColor(.white)
                .padding(.horizontal, 17)
                .frame(height: 43)
                .background(RoundedRectangle(cornerRadius: 22).fill(AliciaStyle.panel))
                .overlay(RoundedRectangle(cornerRadius: 22)
                    .stroke(AliciaStyle.line.opacity(0.9), lineWidth: 1.5))
            Button(action: sendMessage) {
                Image(systemName: "paperplane.fill")
                    .font(.system(size: 18))
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(AliciaStyle.glow))
                    .shadow(color: AliciaStyle.sky.opacity(0.45), radius: 7)
            }
            .buttonStyle(PlainButtonStyle())
            .disabled(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .padding(14)
        .background(AliciaStyle.navy)
    }

    private var roundedInner: some View {
        RoundedRectangle(cornerRadius: 14)
            .fill(AliciaStyle.panelLight)
            .overlay(RoundedRectangle(cornerRadius: 14)
                .stroke(AliciaStyle.line.opacity(0.7), lineWidth: 1))
    }

    private func primaryButton(_ label: String, symbol: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(label, systemImage: symbol)
                .font(.system(size: 13, weight: .semibold))
                .frame(maxWidth: .infinity)
                .padding(11)
                .background(RoundedRectangle(cornerRadius: 16).fill(AliciaStyle.glow))
                .shadow(color: AliciaStyle.violet.opacity(0.4), radius: 8)
        }
        .buttonStyle(PlainButtonStyle())
    }

    private func sectionTitle(_ icon: String, _ title: String) -> some View {
        Label(title, systemImage: icon)
            .font(.system(size: 16, weight: .semibold))
            .foregroundColor(AliciaStyle.faded)
    }

    private func surface<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 22)
                    .fill(LinearGradient(
                        gradient: Gradient(colors: [AliciaStyle.panelLight, AliciaStyle.panel]),
                        startPoint: .topLeading, endPoint: .bottomTrailing))
            )
            .overlay(RoundedRectangle(cornerRadius: 22)
                .stroke(AliciaStyle.line.opacity(0.8), lineWidth: 1.1))
            .shadow(color: AliciaStyle.violet.opacity(0.09), radius: 9)
    }

    private var settings: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Alicia V0.2 · Mac")
                .font(.title).foregroundColor(AliciaStyle.sky)
            Text("Application native pour Mac Intel sous macOS Big Sur 11.0 ou plus récent.")
            Text("La voix française, les styles de voix, les modes d’interface et les boutons d’émotions sont disponibles.")
            Text("Le moteur de conversation IA, la dictée, l’avatar 3D et la synchronisation des conversations entre iPhone et Mac restent à développer.")
            Text("AltServer détecté : \(altServerActive ? "oui" : "non"). Cette présence ne confirme pas le renouvellement iPhone.")
            Button("Fermer") { showSettings = false }
        }
        .foregroundColor(.white)
        .padding(26)
        .frame(width: 530)
        .background(AliciaStyle.navy)
    }

    private func sendMessage() {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        messages.append(AliciaMessage(user: true, text: text, demonstration: false))
        messages.append(AliciaMessage(user: false,
            text: "Message reçu. Le moteur d’intelligence artificielle n’est pas encore connecté à cette version Mac.",
            demonstration: false))
        input = ""
    }

    private func refreshAltServer() {
        altServerActive = NSWorkspace.shared.runningApplications.contains {
            ($0.localizedName ?? "").localizedCaseInsensitiveContains("AltServer")
            || ($0.bundleIdentifier ?? "").localizedCaseInsensitiveContains("altserver")
        }
    }
}
