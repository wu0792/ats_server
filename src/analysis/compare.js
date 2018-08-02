const compareImages = require("resemblejs/compareImages");
const resemble = require('resemblejs')
const fs = require("mz/fs");

async function compare() {
    const options = {
        output: {
            errorColor: {
                red: 255,
                green: 0,
                blue: 255
            },
            errorType: "movement",
            transparency: 0.3,
            // largeImageThreshold: 1200,
            // useCrossOrigin: false,
            outputDiff: true
        },
        // scaleToSameSize: true,
        // ignore: "antialiasing"
    };

    try {
        let file1 = await fs.readFile("./expect/1533218989193/46.jpeg"),
            file2 = await fs.readFile("./actual/1533218989193/46.jpeg")

        resemble(file1).compareTo(file2).onComplete(async function (data) {
            // return data;
            fs.writeFileSync("./compare/1533218989193/46.jpeg", data.getBuffer())
            // await fs.writeFile("./compare/1533218989193/46.jpeg", data.getBuffer());
            /*
            {
              misMatchPercentage : 100, // %
              isSameDimensions: true, // or false
              getImageDataUrl: function(){}
            }
            */
        });

        // const data = await compareImages(
        //     file1,
        //     file2,
        //     options
        // );

        // await fs.writeFile("./compare/1533218989193/46.jpeg", data.getBuffer());
    } catch (error) {
        console.error(error)
    }
}

module.exports = compare