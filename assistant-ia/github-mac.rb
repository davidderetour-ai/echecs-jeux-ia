#!/usr/bin/env ruby
# Alicia GitHub : consultation des dépôts autorisés (privés et publics), macOS Big Sur.
# Ne stocke aucun secret et n'écrit ni commits ni PR.
require 'net/http'
require 'json'
require 'io/console'
require 'uri'

OWNER='davidderetour-ai'
puts 'ALICIA — mes projets GitHub actuels et futurs'
puts 'Cette consultation ne modifie aucun dépôt.'
puts 'Crée un jeton fine-grained avec propriétaire '+OWNER+' et accès « All repositories », droits Metadata: Read.'
puts 'Saisis-le uniquement ici, dans TON Terminal Mac. Ne l’envoie jamais dans ChatGPT.'
print 'Jeton GitHub (invisible) : '
token=STDIN.noecho(&:gets).to_s.strip
puts
if token.length<20
 warn 'Aucun jeton valide fourni. Aucune connexion effectuée.'
 exit 1
end
repos=[]
page=1
while page<=15
 url=URI("https://api.github.com/user/repos?affiliation=owner&visibility=all&per_page=100&page="+page.to_s)
 req=Net::HTTP::Get.new(url)
 req['Accept']='application/vnd.github+json'
 req['X-GitHub-Api-Version']='2022-11-28'
 req['User-Agent']='alicia-github-mac'
 req['Authorization']='Bearer '+token
 response=Net::HTTP.start(url.host,url.port,:use_ssl=>true,:open_timeout=>15,:read_timeout=>20){|http|http.request(req)}
 unless response.code=='200'
  warn 'GitHub a refusé l’accès : HTTP '+response.code.to_s+'. Vérifie les permissions du jeton.'
  exit 2
 end
 data=JSON.parse(response.body)
 unless data.is_a?(Array)
  warn 'Réponse GitHub inattendue.';exit 2
 end
 data.each do |p|
  next unless p.dig('owner','login').to_s.downcase==OWNER.downcase
  repos << {'name'=>p['name'],'private'=>p['private'],'default_branch'=>p['default_branch'],'url'=>p['html_url']}
 end
 break if data.length<100
 page+=1
end
puts
puts 'Dépôts accessibles (actuels, selon les autorisations du jeton) : '+repos.length.to_s
repos.each do |repo|
 puts (repo['private'] ? '[PRIVÉ] ' : '[PUBLIC] ')+repo['name'].to_s+' · branche '+repo['default_branch'].to_s
end
puts
puts 'Si GitHub est configuré sur « All repositories », les futurs dépôts de ce propriétaire seront aussi visibles lors de la prochaine consultation, tant que le jeton restera valable.'
puts 'Ce programme ne copie pas les fichiers des projets, ne les modifie pas et ne crée aucune PR.'
token.replace('') if token.respond_to?(:replace)
