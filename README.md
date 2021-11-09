# RTXStatus
Discord bot displaying the status of the Revive Tanki X server in real time
# Configuring
To configure, you need to modify `helper/config.json` file.
First of all, you need to insert you bot's token, which you can acquire on [Discord Developer Portal](https://discord.con/developers).
You'll also need to change language.
"all" - means Russian and English
"en" - means English
"ru" - means Russian
Next, you need to specify which server status you want to monitor. The default is the IP address of the Revive TX server.
And the last thing you need to do is specify in which channel(s) you need the bot to display the server status.
Copy the channel ID and enter it in the "channels" line.
All is ready. After that, you should open up the console, move to the RTXStatus directory, and write into the console this:
=======
To configure, you need to modify `helper/config.json` file.  
First of all, you need to change language.  
"all" - means Russian and English  
"en" - means English  
"ru" - means Russian  
You'll also need to insert you bot's token, which you can acquire on [Discord Developer Portal](https://discord.con/developers).  
After that, you should open up the console, move to the RTXStatus directory, and write into the console this:
```
npm i && npm start
```
