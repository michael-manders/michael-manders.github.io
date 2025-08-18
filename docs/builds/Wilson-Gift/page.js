previousStates = [];
forwardStates = [];

RESEND_API = "re_6Tpb2Pwp_NLBziuL62W1RVuuutPEzsdEf";

function drawBoard() {
    var myCanvas = document.getElementById("canvas");
    var curColor = $("#selectColor option:selected").val();
    if (myCanvas) {
        var isDown = false;
        var ctx = myCanvas.getContext("2d");
        w = window.innerWidth;
        h = w * (480 / 800);
        ctx.width = 800;
        ctx.height = 480;
        myCanvas.width = ctx.width;
        myCanvas.height = ctx.height;

        let divx = w / 800;
        let divy = h / 480;

        if (window.innerWidth >= 800) {
            divx = 1;
            divy = 1;
        }

        var canvasX, canvasY;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, ctx.width, ctx.height);
        ctx.lineWidth = 5;

        var selectSize = document.getElementById("selectSize");
        selectSize.addEventListener("input", function () {
            ctx.lineWidth = selectSize.value;
            console.log("Line width set to: " + ctx.lineWidth);
            document.getElementById("sizeValue").innerText = selectSize.value;
        });

        $(myCanvas)
            .mousedown(function (e) {
                isDown = true;
                ctx.beginPath();
                canvasX = (e.pageX - myCanvas.offsetLeft) / divx;
                canvasY = (e.pageY - myCanvas.offsetTop) / divy;
                console.log("mousedown at: " + canvasX + ", " + canvasY);
                ctx.moveTo(canvasX, canvasY);
            })
            .mousemove(function (e) {
                if (isDown != false) {
                    canvasX = (e.pageX - myCanvas.offsetLeft) / divx;
                    canvasY = (e.pageY - myCanvas.offsetTop) / divy;
                    ctx.lineTo(canvasX, canvasY);
                    ctx.strokeStyle = curColor;
                    ctx.stroke();
                }
            })
            .mouseup(function (e) {
                isDown = false;
                ctx.closePath();
                saveState();
            });

        myCanvas.addEventListener("touchstart", function (e) {
            e.preventDefault(); // Prevent scrolling

            isDown = true;
            var touch = e.touches[0];
            canvasX = (touch.pageX - myCanvas.offsetLeft) / divx;
            canvasY = (touch.pageY - myCanvas.offsetTop) / divy;
            console.log("touchstart at: " + canvasX + ", " + canvasY);
            ctx.beginPath();
            ctx.moveTo(canvasX, canvasY);
        });

        myCanvas.addEventListener("touchmove", function (e) {
            e.preventDefault(); // Prevent scrolling

            if (isDown) {
                var touch = e.touches[0];
                canvasX = (touch.pageX - myCanvas.offsetLeft) / divx;
                canvasY = (touch.pageY - myCanvas.offsetTop) / divy;
                ctx.lineTo(canvasX, canvasY);
                ctx.strokeStyle = curColor;
                ctx.stroke();
            }
        });

        myCanvas.addEventListener("touchend", function (e) {
            isDown = false;
            ctx.closePath();
            saveState();
        });
    }

    $("#selectColor").change(function () {
        curColor = $("#selectColor option:selected").val();
    });
}

function handleImageUpload(event) {
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");
    let imageInput = document.getElementById("imageInput");

    let file = event.target.files[0];
    if (file) {
        let img = new Image();
        let reader = new FileReader();

        reader.onload = function (e) {
            img.onload = function () {
                // Calculate the new image size while maintaining the aspect ratio
                let canvasRatio = canvas.width / canvas.height;
                let imgRatio = img.width / img.height;

                let newWidth, newHeight;
                if (canvasRatio > imgRatio) {
                    // If canvas is more "landscape" than the image
                    newHeight = canvas.height;
                    newWidth = img.width * (newHeight / img.height);
                } else {
                    // If canvas is more "portrait" than the image
                    newWidth = canvas.width;
                    newHeight = img.height * (newWidth / img.width);
                }

                offset = (canvas.width - newWidth) / 2;

                // Draw the resized image to the canvas
                ctx.drawImage(img, offset, 0, newWidth, newHeight);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    setTimeout(() => {
        applyFloydSteinbergDitheringToBlackAndWhite(ctx);
    }, 2000); // Delay to ensure the image is loaded before applying dithering
}

function applyFloydSteinbergDitheringToBlackAndWhite(ctx) {
    const imageData = ctx.getImageData(
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
    );
    const data = imageData.data;

    // Loop through every pixel (each pixel has 4 entries: R, G, B, A)
    for (let y = 0; y < ctx.canvas.height; y++) {
        for (let x = 0; x < ctx.canvas.width; x++) {
            const i = (y * ctx.canvas.width + x) * 4;

            // Get the current pixel's RGB values
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Convert RGB to Greyscale (luminance)
            const grey = Math.round(0.3 * r + 0.59 * g + 0.11 * b);

            // Determine if the pixel is black (0) or white (255) based on dithering
            const newGrey = grey >= 128 ? 255 : 0; // Simple thresholding

            // Set the new greyscale values for the pixel
            data[i] = newGrey; // Red
            data[i + 1] = newGrey; // Green
            data[i + 2] = newGrey; // Blue

            // Calculate the error for the pixel
            const error = grey - newGrey;

            // Distribute the error to neighboring pixels using Floyd-Steinberg coefficients
            if (x + 1 < ctx.canvas.width) {
                data[i + 4] += (error * 7) / 16;
                data[i + 5] += (error * 7) / 16;
                data[i + 6] += (error * 7) / 16;
            }

            if (y + 1 < ctx.canvas.height) {
                if (x > 0) {
                    data[i + ctx.canvas.width * 4 - 4] += (error * 3) / 16;
                    data[i + ctx.canvas.width * 4 - 3] += (error * 3) / 16;
                    data[i + ctx.canvas.width * 4 - 2] += (error * 3) / 16;
                }
                data[i + ctx.canvas.width * 4] += (error * 5) / 16;
                data[i + ctx.canvas.width * 4 + 1] += (error * 5) / 16;
                data[i + ctx.canvas.width * 4 + 2] += (error * 5) / 16;
            }
        }
    }

    // Put the modified image data back onto the canvas
    ctx.putImageData(imageData, 0, 0);

    setTimeout(() => saveState(), 1000);
}

setBackground = (color) => {
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
};

saveState = () => {
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");
    previousStates.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    console.log("State saved. Total states: " + previousStates.length);

    if (previousStates.length > 15) previousStates.pop(0);
    forwardStates = [];
};

undoState = () => {
    if (previousStates.length > 0) {
        let canvas = document.getElementById("canvas");
        let ctx = canvas.getContext("2d");
        forwardStates.push(previousStates.pop());
        // forwardStates.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (previousStates.length > 0) {
            ctx.putImageData(previousStates[previousStates.length - 1], 0, 0);
        }
        console.log("State undone. Remaining states: " + previousStates.length);
    }
};

redoState = () => {
    console.log(forwardStates);
    if (forwardStates.length > 0) {
        let canvas = document.getElementById("canvas");
        let ctx = canvas.getContext("2d");
        ctx.putImageData(forwardStates[forwardStates.length - 1], 0, 0);

        previousStates.push(forwardStates.pop());
    }
    console.log("Redoing state");
};

function getImageData() {
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");

    const data = ctx.getImageData(
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
    ).data;

    dataStream = "";
    for (let y = 0; y < 480; y++) {
        for (let x = 0; x < 800; x++) {
            const i = (y * ctx.canvas.width + x) * 4;

            r = data[i];
            g = data[i + 1];
            b = data[i + 2];

            if (r > g && r > b) {
                // red
                dataStream += "3";
            } else if (r == 0) {
                // black
                dataStream += "1";
            } else if (r == g) {
                // white
                dataStream += "2";
            }
        }
    }
    console.log(dataStream.length);
    return dataStream;
}
const base64Alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function compress(base4Str) {
    let bigIntValue = BigInt(0);
    for (let i = 0; i < base4Str.length; i++) {
        const digit = base4Str[i];
        if (digit < "0" || digit > "3")
            throw new Error("Invalid base-4 digit: " + digit);
        bigIntValue = bigIntValue * BigInt(4) + BigInt(digit);
    }

    if (bigIntValue === BigInt(0)) return "A"; // "A" is index 0

    let base64Str = "";
    while (bigIntValue > 0) {
        console.log(base64Str.length);
        const remainder = bigIntValue % BigInt(64);
        base64Str = base64Alphabet[Number(remainder)] + base64Str;
        bigIntValue = bigIntValue / BigInt(64);
    }

    return base64Str;
}

function base64ToBase4(base64Str) {
    // Convert base-64 string to BigInt
    let bigIntValue = BigInt(0);
    for (let i = 0; i < base64Str.length; i++) {
        const index = base64Alphabet.indexOf(base64Str[i]);
        if (index === -1)
            throw new Error("Invalid base64 character: " + base64Str[i]);
        bigIntValue = bigIntValue * BigInt(64) + BigInt(index);
    }

    // Convert BigInt to base-4 string
    if (bigIntValue === BigInt(0)) return "0";

    let base4Str = "";
    while (bigIntValue > 0) {
        const remainder = bigIntValue % BigInt(4);
        base4Str = remainder.toString() + base4Str;
        bigIntValue = bigIntValue / BigInt(4);
    }

    return base4Str;
}

async function sendEmail(toP) {
    // Get the form values
    const to = "victoriasmith3010@gmail.com";
    const subject = to;
    const body = getImageData();

    // Resend API key (this needs to be securely stored, not in the frontend)
    const apiKey = RESEND_API; // DO NOT expose this in production

    const emailData = {
        to: to,
        subject: toP,
        html: body,
        from: "project@email.michaelmanders.com", // You can use a verified email here
    };

    const response = await fetch(
        "https://corsproxy.io/https://api.resend.com/emails",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(emailData),
        }
    );

    const data = await response.json();

    if (response.ok) {
        alert("Uploaded sent successfully!");
    } else {
        console.error("Error sending email:", data);
        alert("Failed to Upload. Check the console for errors.");
    }
}

window.onload = () => {
    imageInput.addEventListener("change", handleImageUpload);

    drawBoard();
};
