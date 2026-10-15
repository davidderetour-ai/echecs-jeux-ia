#!/usr/bin/env ruby
# Alicia iPhone <-> Mac : messages texte sur le même Wi-Fi, sans commande système.
# Ruby/WEBrick macOS Big Sur. Usage : ruby mac-iphone-bridge.rb --lan
# HTTP sur Wi-Fi local, NON chiffré ; ne jamais utiliser pour des informations sensibles.
require 'webrick'
require 'json'
require 'securerandom'
require 'socket'
require 'thread'
require 'time'

MODE_LAN=ARGV.include?('--lan')
HOST=MODE_LAN ? '0.0.0.0' : '127.0.0.1'
PORT=8766
ROOT=File.expand_path(File.dirname(__FILE__))
CODE=SecureRandom.hex(16)
MESSAGES=[]
LOCK=Mutex.new
MAX_MESSAGES=100
MAX_BYTES=2500
CSP="default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"

def error_reply(res,status,message)
 res.status=status
 res['Content-Type']='application/json; charset=utf-8'
 res.body=JSON.generate({'error'=>message})
end

def local_ips
 Socket.ip_address_list.select{|i| i.ipv4? && !i.ipv4_loopback?}.map(&:ip_address).uniq
end

if MODE_LAN
 puts "MODE WI-FI : les messages HTTP ne sont PAS chiffrés."
 puts "Ne lance pas ce service sur un réseau public, invité ou inconnu."
 puts "NE SAISIS JAMAIS de mot de passe, jeton GitHub, donnée bancaire ou document confidentiel."
 print "Pour permettre les échanges texte iPhone-Mac sur TON Wi-Fi, tape OUVRIR WIFI ALICIA : "
 input=STDIN.gets
 unless input && input.strip=="OUVRIR WIFI ALICIA"
  puts "Annulé : aucun service n'a été ouvert."
  exit 1
 end
end
logger=WEBrick::Log.new($stderr,WEBrick::Log::WARN)
server=WEBrick::HTTPServer.new(
 :Port=>PORT,:BindAddress=>HOST,:Logger=>logger,:AccessLog=>[],
 :MaxClients=>12,:RequestTimeout=>18
)
server.mount_proc('/') do |req,res|
 res['Cache-Control']='no-store'
 res['X-Content-Type-Options']='nosniff'
 res['X-Frame-Options']='DENY'
 res['Referrer-Policy']='no-referrer'
 res['Content-Security-Policy']=CSP
 res['Permissions-Policy']='camera=(), microphone=(), geolocation=()'
 if req.request_method=='GET' && (req.path=='/' || req.path=='/iphone.html')
  res['Content-Type']='text/html; charset=utf-8'
  res.body=File.binread(File.join(ROOT,'iphone.html'))
 elsif req.request_method=='GET' && req.path=='/iphone-link.js'
  res['Content-Type']='text/javascript; charset=utf-8'
  res.body=File.binread(File.join(ROOT,'iphone-link.js'))
 elsif req.path=='/api/bridge/messages' && ['GET','POST'].include?(req.request_method)
  # Ne jamais permettre la lecture ou l'écriture sans code d'association aléatoire.
  provided=req.header['x-alicia-code']&.first.to_s
  if provided.bytesize!=CODE.bytesize || !provided.bytes.zip(CODE.bytes).reduce(0){|acc,p|acc|(p[0]^p[1])}.zero?
   error_reply(res,401,'Code de liaison incorrect : regarde la fenêtre Terminal du Mac.')
  elsif req.request_method=='GET'
   data=LOCK.synchronize{MESSAGES.map(&:dup)}
   res['Content-Type']='application/json; charset=utf-8'
   res.body=JSON.generate({'messages'=>data})
  else
   if req['content-type'].to_s.split(';').first!='application/json'
    error_reply(res,415,'Contenu JSON requis.')
   elsif req.body.to_s.bytesize>MAX_BYTES
    error_reply(res,413,'Message limité à 2 500 octets.')
   else
    begin
     data=JSON.parse(req.body)
     text=data['text']
     from=data['from']
     if !text.is_a?(String) || text.strip.empty? || text.bytesize>1500 ||
       !['iphone','mac'].include?(from)
      error_reply(res,400,'Message incorrect ou trop long.')
     else
      item={'id'=>SecureRandom.hex(8),'from'=>from,'text'=>text.strip,'at'=>Time.now.utc.iso8601}
      LOCK.synchronize{MESSAGES.push(item); MESSAGES.shift while MESSAGES.length>MAX_MESSAGES}
      res['Content-Type']='application/json; charset=utf-8'
      res.body=JSON.generate({'saved'=>true,'message'=>item})
     end
    rescue JSON::ParserError
     error_reply(res,400,'JSON incorrect.')
    end
   end
  end
 else
  error_reply(res,404,'Fonction non disponible : aucune exécution de commandes à distance.')
 end
end
trap('INT'){server.shutdown}
trap('TERM'){server.shutdown}
puts "Alicia iPhone ↔ Mac : service prêt sur le port #{PORT}"
puts "Code d’association (nouveau à chaque démarrage) : #{CODE}"
puts "Mac : http://127.0.0.1:#{PORT}/"
if MODE_LAN
 puts "iPhone : ouvrir Safari sur l'une de ces adresses, même Wi-Fi :"
 local_ips.each{|ip| puts "  http://#{ip}:#{PORT}/" }
 puts "Si les connexions échouent : vérifier l'autorisation réseau du pare-feu Mac."
end
puts "Appuie sur Ctrl+C pour arrêter complètement les échanges."
server.start
