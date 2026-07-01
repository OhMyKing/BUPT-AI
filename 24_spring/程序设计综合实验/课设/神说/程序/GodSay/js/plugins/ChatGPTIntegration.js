(() => {
    const parameters = PluginManager.parameters('ChatGPTIntegration');
    const worldSetting = parameters['worldSetting'];
    const apiKey = parameters['apiKey'] || '';
    
    const modelName = "gpt-3.5-turbo";
    const dialogHistory = [];
    let plot = ''

    async function sendMessage(message,currentPlot){
        Graphics.stopGameLoop();
        plot = plot + currentPlot
        let url = "https:
        let messages = [
            {
                "role": "system",
                "content": `World setting: ${worldSetting}. Current plot: ${plot}.`
            },
            ...dialogHistory.map(entry => ({
                "role": entry.speaker === "Player" ? "user" : "assistant",
                "content": entry.message
            })),
            {
                "role": "user",
                "content": message
            }
        ];
        
        let payload = {
            model: modelName,
            messages: messages
        };

        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify(payload)
        });
        let data = await response.json();
        dialogHistory.push({speaker: "Player", message: message});
        if (data.choices && data.choices.length > 0) {
            let botResponse = data.choices[0].message.content.trim();
            dialogHistory.push({speaker: "ChatGPT", message: botResponse});
            Graphics.startGameLoop();
            return botResponse;
        }
        Graphics.startGameLoop();
        return "No response from ChatGPT.";
    }

    PluginManager.registerCommand('ChatGPTIntegration', 'SendMessage', args => {
        const message = $gameVariables.value(Number(args.inputId));
        const currentPlot = args.currentPlot;
        sendMessage(message, currentPlot).then(response => {
            $gameVariables.setValue(Number(args.outputId), response);
            console.log($gameVariables.value(Number(args.outputId)))
            const info = $gameVariables.value(args.outputId);
            const formattedMessage = info.replace(/(.{29})/g, '$1\n');
            $gameMessage.add(formattedMessage);

        });
    });
})();
