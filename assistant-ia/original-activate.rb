#!/usr/bin/env ruby
# Alicia Original : vérification ponctuelle du propriétaire GitHub depuis son Mac.
# Le jeton n'est pas conservé. Ce marqueur local n'est PAS une signature infalsifiable.
require 'net/http'
require 'json'
require 'io/console'
require 'fileutils'
require 'time'
require 'uri'
OWNER='davidderetour-ai'
puts "=== Alicia Original : activation réservée au propriétaire ==="
puts "Une installation téléchargée depuis GitHub est une copie par défaut."
puts "Pour marquer CETTE installation comme originale, GitHub doit confirmer que tu es #{OWNER}."
puts "Cette vérification n'enregistre pas ton jeton, ne modifie pas macOS et n'accorde aucun droit aux copies."
print "Jeton GitHub personnel (saisie cachée) : "
token=STDIN.noecho(&:gets).to_s.strip
puts
if token.length<20
 warn "Jeton absent ou trop court. Aucune activation.";exit 2
end
begin
 uri=URI("https://api.github.com/user")
 req=Net::HTTP::Get.new(uri)
 req['Accept']='application/vnd.github+json'
 req['User-Agent']='alicia-original-activation'
 req['Authorization']='Bearer '+token
 response=Net::HTTP.start(uri.host,uri.port,use_ssl:true,open_timeout:12,read_timeout:20){|http|http.request(req)}
 unless response.code=='200'
  warn "GitHub n'a pas confirmé ton identité (HTTP #{response.code}). Aucune activation."
  exit 2
 end
 user=JSON.parse(response.body)
 unless user['login'].to_s.downcase==OWNER.downcase
  warn "Ce compte n'est pas le propriétaire original. Aucune activation."
  exit 3
 end
 path=File.join(Dir.home,"Library","Application Support","Alicia")
 FileUtils.mkdir_p(path,mode:0700)
 marker=File.join(path,"original-status.json")
 data={'role'=>'owner-activated-original','verifiedGitHubOwner'=>OWNER,'verifiedAt'=>Time.now.utc.iso8601,
 'source'=>'GitHub /user verified; token not stored',
 'warning'=>'Local status, not cryptographic proof or right to delete other installations.'}
 File.open(marker,File::WRONLY|File::CREAT|File::TRUNC,0600){|f|f.write(JSON.pretty_generate(data)+"\n")}
 File.chmod(0600,marker)
 puts "Alicia Original : statut activé sur ce Mac après confirmation GitHub."
 puts "Le rôle sera préservé par les mises à jour tant que ce fichier privé est conservé."
rescue JSON::ParserError,SocketError,SystemCallError,Timeout::Error=>e
 warn "Vérification échouée : #{e.class}. Aucune modification macOS."
 exit 4
ensure
 token.replace('') if token
end
