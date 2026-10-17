import 'dart:async';
import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'services/emotion_audio.dart';
import 'services/network_status.dart';
import 'widgets/signature_card.dart';

void main() { WidgetsFlutterBinding.ensureInitialized(); runApp(const AliciaApp()); }
const navy=Color(0xff09112a), muted=Color(0xffb8c5e7), icy=Color(0xff8bcaff);
class AliciaApp extends StatelessWidget {
 const AliciaApp({super.key});
 @override Widget build(BuildContext c)=>MaterialApp(
  title:'Alicia', debugShowCheckedModeBanner:false,
  theme:ThemeData(useMaterial3:true,brightness:Brightness.dark,scaffoldBackgroundColor:navy,
   colorScheme:ColorScheme.fromSeed(seedColor:const Color(0xff8f6dff),brightness:Brightness.dark)),
  home:const AliciaFusionScreen());
}
class AliciaScreen extends StatefulWidget {
 const AliciaScreen({super.key});
 @override State<AliciaScreen> createState()=>_AliciaScreenState();
}
class _AliciaScreenState extends State<AliciaScreen> {
 final question=TextEditingController(),tts=FlutterTts(),audio=AliciaEmotionAudio();
 StreamSubscription<List<ConnectivityResult>>? subscription;
 NetworkKind network=NetworkKind.unknown;
 String mode='Général',voiceStyle='Douce';
 String? emotion;
 final messages= <(String,bool)>[
  ('Bonjour ! Cette première version native reprend l’interface d’Alicia. La voix, les sons et le réseau utilisent le téléphone ; la conversation IA sera reliée à un moteur séparément.',true)
 ];
 @override void initState(){super.initState();initialize();}
 Future<void> initialize() async {
  try {
   final result=await Connectivity().checkConnectivity();
   if(mounted)setState(()=>network=classifyNetwork(result));
   subscription=Connectivity().onConnectivityChanged.listen((r){if(mounted)setState(()=>network=classifyNetwork(r));});
  }catch(_){}
  try{await tts.setLanguage('fr-FR');await tts.setSpeechRate(.5);}catch(_){}
 }
 @override void dispose(){subscription?.cancel();question.dispose();tts.stop();audio.dispose();super.dispose();}
 void info(String msg){if(mounted)ScaffoldMessenger.of(context).showSnackBar(SnackBar(content:Text(msg)));}
 Future<void> speak(String message) async {
  try{
   await tts.stop();
   await tts.setLanguage('fr-FR');
   await tts.setSpeechRate(voiceStyle == 'Douce' ? 0.43 : (voiceStyle == 'Naturelle' ? 0.51 : 0.61));
   await tts.setPitch(voiceStyle=='Douce'?1.09:1.0);
   await tts.speak(message);
  }catch(_){info('Synthèse vocale indisponible sur cet appareil.');}
 }
 Future<void> play(AliciaEmotion e) async {
  setState(()=>emotion=switch(e){
   AliciaEmotion.laugh=>'😂 Joie',AliciaEmotion.sadness=>'😢 Tristesse',
   AliciaEmotion.fear=>'😨 Peur',AliciaEmotion.anger=>'😠 Colère'});
  try{await audio.play(e);}catch(_){info('Lecture du bruitage indisponible.');}
  await Future<void>.delayed(const Duration(seconds:2));
  if(mounted)setState(()=>emotion=null);
 }
 void send(){
  final q=question.text.trim();if(q.isEmpty)return;
  setState((){
   messages.add((q,false));
   messages.add(('Message reçu. Cette version native n’est pas encore connectée au moteur IA : je n’invente pas de réponse.',true));
   question.clear();
  });
 }
 void settings()=>showModalBottomSheet<void>(context:context,showDragHandle:true,backgroundColor:const Color(0xff182648),
  builder:(c)=>const SafeArea(child:Padding(padding:EdgeInsets.all(22),child:Column(
   mainAxisSize:MainAxisSize.min,crossAxisAlignment:CrossAxisAlignment.start,children:[
    Text('Alicia native',style:TextStyle(fontSize:22,fontWeight:FontWeight.bold)),
    SizedBox(height:12),
    Text('Cette interface ne dépend pas de Safari. Les fonctions de voix, réseau et son passent par les API du système.'),
    SizedBox(height:12),
    Text('Niveau : non évalué. Le moteur IA et la dictée nécessitent une intégration supplémentaire ; aucun QI inventé.'),
    SizedBox(height:12),
    Text('Aucun abonnement ChatGPT ni paiement déclenché.',style:TextStyle(color:muted))
   ]))));
 @override Widget build(BuildContext context)=>Scaffold(
  body:SafeArea(child:Center(child:ConstrainedBox(constraints:const BoxConstraints(maxWidth:1000),
   child:Column(children:[
    header(),
    Expanded(child:SingleChildScrollView(padding:const EdgeInsets.all(11),child:Column(children:[
     hero(),const SizedBox(height:12),const SignatureCard(),const SizedBox(height:12),rowPanels(),const SizedBox(height:12),
     modes(),const SizedBox(height:12),chat()
    ]))),
    composer()
   ])))),
 );
 Widget header()=>Padding(padding:const EdgeInsets.fromLTRB(12,9,10,9),child:Row(children:[
  Container(width:46,height:46,decoration:BoxDecoration(
   borderRadius:BorderRadius.circular(15),
   gradient:const LinearGradient(colors:[icy,Color(0xff745aff),Color(0xffb163df)])),
   child:const Icon(Icons.auto_awesome,size:26)),
  const SizedBox(width:9),
  Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
   const Text('ALICIA',style:TextStyle(fontSize:24,color:Color(0xffbcd6ff),letterSpacing:3)),
   Text('Assistant · Code · Diagnostic · Création',maxLines:2,style:TextStyle(fontSize:10,color:Colors.blue.shade100))
  ])),
  IconButton(onPressed:()=>info(network.title=='Wi-Fi'?'Wi-Fi signalé par le système. Le nom du réseau reste inconnu.':network.title),
   tooltip:'Connexion',icon:Icon(switch(network){
     NetworkKind.wifi=>Icons.wifi_rounded,NetworkKind.ethernet=>Icons.settings_ethernet,
     NetworkKind.cellular=>Icons.signal_cellular_alt,NetworkKind.disconnected=>Icons.wifi_off,
     NetworkKind.unknown=>Icons.help_outline
    },color:network.canUseAiNetwork?Colors.greenAccent:network==NetworkKind.unknown?Colors.amberAccent:Colors.redAccent)),
  IconButton(onPressed:settings,tooltip:'Réglages',icon:const Icon(Icons.settings_outlined,color:Color(0xffb3c6ff)))
 ]));
 Widget hero()=>glass(Row(children:[
  Expanded(flex:56,child:ClipRRect(borderRadius:const BorderRadius.horizontal(left:Radius.circular(18)),
   child:FutureBuilder<String>(
    future:rootBundle.loadString('assets/alicia_portrait.b64'),
    builder:(c,snapshot) {
     if(!snapshot.hasData)return const SizedBox(height:236,child:Icon(Icons.face_3,size:100,color:icy));
     try{
      return Image.memory(base64Decode(snapshot.data!.trim()),height:236,fit:BoxFit.cover,
       gaplessPlayback:true,errorBuilder:(c,e,trace)=>const SizedBox(height:236,child:Icon(Icons.face_3,size:100,color:icy)));
     }catch(_){return const SizedBox(height:236,child:Icon(Icons.face_3,size:100,color:icy));}
    }))),
  Expanded(flex:44,child:Padding(padding:const EdgeInsets.all(10),child:Column(
   crossAxisAlignment:CrossAxisAlignment.start,mainAxisAlignment:MainAxisAlignment.center,children:[
    Row(children:[const Icon(Icons.circle,color:Colors.greenAccent,size:9),const SizedBox(width:7),
     Expanded(child:Text(emotion??'Alicia est prête',
      style:const TextStyle(fontSize:14,fontWeight:FontWeight.bold)))]),
    const SizedBox(height:10),
    const Text('Pour répondre, expliquer, créer et vous accompagner.',style:TextStyle(fontSize:11,height:1.35,color:muted)),
    const SizedBox(height:10),
    tag('✦ Intelligente'),const SizedBox(height:5),tag('♡ Bienveillante'),
    const SizedBox(height:5),tag('∞ Polyvalente')
   ])))
 ],mainAxisAlignment:MainAxisAlignment.center),padding:EdgeInsets.zero);
 Widget tag(String t)=>Container(
  decoration:BoxDecoration(borderRadius:BorderRadius.circular(22),
   color:const Color(0xff20366d),border:Border.all(color:const Color(0xff426ab5))),
  padding:const EdgeInsets.symmetric(horizontal:8,vertical:5),
  child:Text(t,style:const TextStyle(fontSize:10,color:Color(0xffd4e3ff))));
 Widget rowPanels()=>LayoutBuilder(builder:(c,s){
  final a=voicePanel(),b=emotionPanel();
  if(s.maxWidth<345)return Column(children:[a,const SizedBox(height:10),b]);
  return Row(crossAxisAlignment:CrossAxisAlignment.start,children:[
   Expanded(child:a),const SizedBox(width:10),Expanded(child:b)]);
 });
 Widget voicePanel()=>glass(Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
  title(Icons.mic_none,'Voix d’Alicia'),const SizedBox(height:12),
  Container(padding:const EdgeInsets.symmetric(horizontal:8,vertical:12),
   decoration:BoxDecoration(color:const Color(0xff23375d),borderRadius:BorderRadius.circular(12),
    border:Border.all(color:const Color(0xff536bab))),
   child:const Text('🇫🇷  Voix française',style:TextStyle(fontSize:12))),
  const SizedBox(height:9),
  DropdownButtonFormField<String>(
   value:voiceStyle,isExpanded:true,
   decoration:InputDecoration(labelText:'Style de voix',labelStyle:const TextStyle(fontSize:11,color:muted),
    contentPadding:const EdgeInsets.symmetric(horizontal:8,vertical:8),
    border:OutlineInputBorder(borderRadius:BorderRadius.circular(13))),
   items:['Douce','Naturelle','Dynamique'].map((s)=>DropdownMenuItem(value:s,
    child:Text(s,style:const TextStyle(fontSize:12)))).toList(),
   onChanged:(v){if(v!=null)setState(()=>voiceStyle=v);}
  ),
  const SizedBox(height:11),
  DecoratedBox(decoration:BoxDecoration(
    gradient:const LinearGradient(colors:[Color(0xff439bff),Color(0xff776eff),Color(0xffac5fe5)]),
    borderRadius:BorderRadius.circular(14),
    boxShadow:const [BoxShadow(color:Color(0x447072ff),blurRadius:13)]),
   child:TextButton.icon(onPressed:()=>speak('Bonjour ! Je suis Alicia, ton assistante en français.'),
    icon:const Icon(Icons.play_circle,color:Colors.white,size:19),
    label:const Text('Écouter Alicia',style:TextStyle(color:Colors.white,fontWeight:FontWeight.bold,fontSize:11))))
 ]));
 Widget emotionPanel()=>glass(Column(children:[
  title(Icons.emoji_emotions_outlined,'Émotions'),const SizedBox(height:12),
  GridView.count(shrinkWrap:true,physics:const NeverScrollableScrollPhysics(),
   crossAxisCount:2,mainAxisSpacing:7,crossAxisSpacing:7,childAspectRatio:1.14,
   children:[
    emotionButton('😂','Rire',AliciaEmotion.laugh),
    emotionButton('😢','Tristesse',AliciaEmotion.sadness),
    emotionButton('😨','Peur',AliciaEmotion.fear),
    emotionButton('😠','Colère',AliciaEmotion.anger,angry:true)
   ])
 ]));
 Widget emotionButton(String emoji,String label,AliciaEmotion e,{bool angry=false})=>Material(
  color:angry?const Color(0xff462743):const Color(0xff28315e),
  borderRadius:BorderRadius.circular(12),
  child:InkWell(onTap:()=>play(e),borderRadius:BorderRadius.circular(12),
   child:Container(decoration:BoxDecoration(borderRadius:BorderRadius.circular(12),
    border:Border.all(color:angry?const Color(0xffa85078):const Color(0xff4c6299))),
    child:Column(mainAxisAlignment:MainAxisAlignment.center,children:[
     Text(emoji,style:const TextStyle(fontSize:23)),const SizedBox(height:5),
     Text(label,style:const TextStyle(fontSize:11))
    ]))));
 Widget modes()=>glass(Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
  title(Icons.extension_outlined,'Mode d’expertise'),const SizedBox(height:12),
  Wrap(spacing:6,runSpacing:7,children:[
   for(final (name,ic) in <(String,IconData)>[
    ('Général',Icons.home_outlined),('Code',Icons.code),('Réparation',Icons.build_outlined),
    ('Création',Icons.palette_outlined),('Professeur',Icons.school_outlined)])
    ChoiceChip(label:Text(name,style:TextStyle(fontSize:11,color:mode==name?navy:Colors.white)),
     avatar:Icon(ic,size:15,color:mode==name?navy:icy),
     selected:mode==name,showCheckmark:false,
     selectedColor:const Color(0xff8ec8ff),backgroundColor:const Color(0xff1b2852),
     side:BorderSide(color:mode==name?icy:const Color(0xff4c62a0)),
     onSelected:(_)=>setState(()=>mode=name))
  ])
 ]));
 Widget chat()=>glass(Column(children:[
  Row(children:[Expanded(child:title(Icons.chat_bubble_outline,'Conversation')),
   TextButton.icon(onPressed:()=>setState(()=>messages.clear()),
    icon:const Icon(Icons.delete_outline,size:16),label:const Text('Effacer',style:TextStyle(fontSize:12)))]),
  const Divider(color:Color(0xff3c518a)),
  SizedBox(height:260,child:ListView.builder(itemCount:messages.length,itemBuilder:(c,i){
   final m=messages[i];
   return Align(alignment:m.$2?Alignment.centerLeft:Alignment.centerRight,
    child:Container(margin:const EdgeInsets.symmetric(vertical:7),padding:const EdgeInsets.all(12),
     constraints:const BoxConstraints(maxWidth:420),
     decoration:BoxDecoration(borderRadius:BorderRadius.circular(15),
      border:Border.all(color:m.$2?const Color(0xff536ba5):const Color(0xff7783f1)),
      color:m.$2?const Color(0xff242c50):const Color(0xff303f9b)),
     child:Text(m.$1,style:const TextStyle(fontSize:12.5,height:1.42))));
  }))
 ]));
 Widget composer()=>Container(padding:const EdgeInsets.all(10),
  decoration:const BoxDecoration(color:Color(0xff0c1533),border:Border(top:BorderSide(color:Color(0xff4a5d8f)))),
  child:Row(children:[
   IconButton.filledTonal(tooltip:'Dictée vocale à venir',onPressed:()=>info('La dictée native nécessite une autorisation du microphone et sera ajoutée ensuite.'),
    icon:const Icon(Icons.mic_none_rounded)),
   const SizedBox(width:6),
   Expanded(child:TextField(controller:question,maxLines:2,minLines:1,onSubmitted:(_)=>send(),
    decoration:InputDecoration(hintText:'Écrivez à Alicia…',hintStyle:const TextStyle(color:muted,fontSize:13),
     filled:true,fillColor:const Color(0xff1b2955),contentPadding:const EdgeInsets.symmetric(horizontal:14,vertical:12),
     border:OutlineInputBorder(borderRadius:BorderRadius.circular(27))))),
   const SizedBox(width:6),
   IconButton.filled(onPressed:send,tooltip:'Envoyer',style:IconButton.styleFrom(backgroundColor:const Color(0xff7d68f4)),
    icon:const Icon(Icons.send_rounded))
  ]));
 Widget title(IconData icon,String label)=>Row(mainAxisSize:MainAxisSize.min,children:[
  Icon(icon,color:icy,size:21),const SizedBox(width:7),
  Flexible(child:Text(label,style:const TextStyle(fontSize:15,fontWeight:FontWeight.w700)))
 ]);
 Widget glass(Widget child,{EdgeInsets padding=const EdgeInsets.all(13)})=>Container(
  padding:padding,decoration:BoxDecoration(
   gradient:const LinearGradient(colors:[Color(0xff1a2b52),Color(0xff111c3c)]),
   borderRadius:BorderRadius.circular(20),
   border:Border.all(color:const Color(0xff5b66aa)),
   boxShadow:const [BoxShadow(color:Color(0x44020314),blurRadius:16,offset:Offset(0,6))]),
  child:child);
}


/// Alicia Fusion : l'interface complète fonctionne dans la fenêtre native iOS.
/// Elle ne lance pas Safari. Le mode natif historique reste disponible séparément.
/// Les modèles 3D et portraits précédents sont aussi embarqués en secours local.
class AliciaFusionScreen extends StatefulWidget {
  const AliciaFusionScreen({super.key});
  @override
  State<AliciaFusionScreen> createState() => _AliciaFusionScreenState();
}

class _AliciaFusionScreenState extends State<AliciaFusionScreen> {
  late final WebViewController web;
  bool loading = true;
  bool failed = false;
  bool wifiAllowed = false;
  bool showingBundled = false;
  StreamSubscription<List<ConnectivityResult>>? fusionNetwork;
  static final Uri site = Uri.parse(
    'https://davidderetour-ai.github.io/echecs-jeux-ia/assistant-ia/?v=094');

  @override
  void initState() {
    super.initState();
    web = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xff080d24))
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) {
          if (mounted && wifiAllowed) setState(() { loading = true; failed = false; });
        },
        onPageFinished: (_) {
          if (mounted && wifiAllowed) setState(() => loading = false);
        },
        onWebResourceError: (error) {
          if (error.isForMainFrame == true && mounted) {
            if (!showingBundled) { loadBundledFusion(); }
            else { setState(() { loading = false; failed = true; }); }
          }
        },
      ));
    fusionNetwork = Connectivity().onConnectivityChanged.listen((connections) {
      final connectedByWifi = connections.contains(ConnectivityResult.wifi);
      if (!connectedByWifi && wifiAllowed) {
        wifiAllowed = false;
        loadBundledFusion();
      } else if (connectedByWifi && !wifiAllowed) {
        loadFusionWithWifi();
      }
    });
    loadFusionWithWifi();
  }

  Future<void> loadFusionWithWifi() async {
    try {
      final connections = await Connectivity().checkConnectivity();
      if (!mounted) return;
      if (!connections.contains(ConnectivityResult.wifi)) {
        wifiAllowed = false;
        await loadBundledFusion();
        return;
      }
      wifiAllowed = true;
      showingBundled = false;
      setState(() { loading = true; failed = false; });
      await web.loadRequest(site);
    } catch (_) {
      if (mounted) setState(() { loading = false; failed = true; });
    }
  }

  /// WebKit charge les fichiers HTML, JS, photos et le GLB contenus dans l'IPA.
  /// Selon les limitations de WebKit, certaines ressources locales peuvent ne pas s'exécuter ;
  /// le mode natif historique reste disponible sans réseau.
  Future<void> loadBundledFusion() async {
    showingBundled = true;
    if (mounted) setState(() { loading = true; failed = false; });
    try {
      await web.loadFlutterAsset('assets/alicia_web/index.html');
      if (mounted) setState(() { loading = false; failed = false; });
    } catch (_) {
      if (mounted) setState(() { loading = false; failed = true; });
    }
  }

  @override
  void dispose() {
    fusionNetwork?.cancel();
    super.dispose();
  }

  void openNative() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const AliciaScreen()),
    );
  }

  void retry() {
    loadFusionWithWifi();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      backgroundColor: const Color(0xff080d24),
      title: const Text('ALICIA Fusion · 0.9.4', style: TextStyle(
        color: Color(0xffd8eaff), fontWeight: FontWeight.bold, fontSize: 17)),
      actions: [
        IconButton(
          tooltip: 'Actualiser Alicia',
          onPressed: retry,
          icon: const Icon(Icons.refresh)),
        PopupMenuButton<String>(
          tooltip: 'Options Alicia',
          onSelected: (value) {
            if (value == 'native') openNative();
            if (value == 'reload') retry();
          },
          itemBuilder: (_) => const [
            PopupMenuItem(value: 'native', child: Text('Mode natif (secours hors ligne)')),
            PopupMenuItem(value: 'reload', child: Text('Actualiser la version complète')),
          ],
        ),
      ],
    ),
    body: SafeArea(
      child: failed
        ? Center(child: Padding(
            padding: const EdgeInsets.all(22),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.wifi_off, size: 54, color: Color(0xff84cfff)),
              const SizedBox(height: 16),
              const Text('Alicia Fusion ne peut pas charger ses ressources locales.',
                textAlign: TextAlign.center, style: TextStyle(fontSize: 18)),
              const SizedBox(height: 12),
              const Text('Le mode natif reste accessible hors connexion. Aucun historique ni préférence n’est supprimé.',
                textAlign: TextAlign.center),
              const SizedBox(height: 18),
              FilledButton(onPressed: retry, child: const Text('Réessayer')),
              TextButton(onPressed: openNative, child: const Text('Ouvrir le mode natif')),
            ])))
        : Stack(children: [
            Positioned.fill(child: WebViewWidget(controller: web)),
            if (loading)
              const Align(
                alignment: Alignment.topCenter,
                child: LinearProgressIndicator(minHeight: 3),
              ),
          ]),
    ),
  );
}
