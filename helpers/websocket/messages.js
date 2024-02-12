export function websocketMessageEvent(event, instance) {
    const message = JSON.parse(event.data)
        switch (message.type) {
            case 'energy_recovery':
                console.log(message)
                break
                // увеличить энергию на фонте
                // let energy = {
                //     value: message.energy,
                //     total: message.energyLimit
                // }
                // instance.saveEnergyRecovery(energy)
            case 'click_income':
                let clicks = {
                    income: message.income,
                    fromBoostId: message.fromBoostId
                }
                instance.saveClicks(clicks)
                // let income = message.income
                // // может быть нулл, если инкам от обычного клика
                // let fromBoostId = message.fromBoostId
                break
    }
}