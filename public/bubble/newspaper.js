let count = 0;
let data = {};
const materials = [
    '#F44336',
    '#3F51B5',
    '#03A9F4',
    '#009688',
    '#4CAF50',
    '#FFEB3B',
    '#FF9800',
    '#795548',
    '#9E9E9E',
    '#607D8B'        
]
let colourStart = parseInt(Math.random() * materials.length);

let margin = { top: 50, right: 50, bottom: 50, left: 50 },
    width = window.innerWidth,
    height = window.innerHeight;

function clear() {
    let chart = document.querySelector('#chart');
    chart.style.opacity = '0';
    setTimeout(() => {
        chart.innerHTML = "<svg></svg>";
        chart.style.opacity = '1';
    }, 300);
}

function makeBubbles(string) {
    fetching = true;

    let year = parseInt(document.querySelector('.time-traveler').value);
    string = string ? string : document.querySelector('#queryBox').value;

    string = string.toLowerCase();
    document.querySelector('.loading').style.opacity = '1';
    document.querySelector('.instructions').style.opacity = '0.3';
    document.querySelector('#queryBox').value = string[0].toUpperCase() + string.substring(1);
    document.querySelector('#queryBox').focus();
    document.querySelector('#queryBox').blur();
    query(string, year).then(() => {
        clear();
        document.querySelector('.slider').style.opacity = '1';
        document.querySelector('.title').style.opacity = '1';
        document.querySelector('.loading').style.opacity = '0';
        setTimeout( () => {
            drawBubbles(string);
        } , 310);
    })
}

function query(string, year) {
    let path = `/similar-to/?phrase=${string}&year=${String(year)}`;
    console.log(path);
    return new Promise((resolve, reject) => {
        fetch(path)
            .then(res => res.json())
            .then(dataset => {
                data[string] = dataset;
                resolve();
            })
            .catch(err => {
                reject(err);
            });
        });
}

function max() {
    let a = -1;

    Object.keys(data).forEach( key => {
        let array = data[key];
        for (i in array) {
            if (array[i].count > a) {
                a = array[i].count;
            }
        }
    });
    console.log(`Max: ${a}`);
    return a;
}

function drawBubbles(string) {
    console.log(data);

    var chart = bubbleChart()
                    .width(width)
                    .height(height)
                    .minRadius(30)
                    .maxRadius(100)
                    .forceApart(-1000)
                    .columnForRadius("count")
                    .columnForColors("name")
                    .columnForTitle("name")
                    .showTitleOnCircle(true);

    d3.select('#chart').datum(data[string]).call(chart);

//     // update settings
// chart.width(850).height(850).minRadius(7).maxRadius(55).forceApart(-170); 

// // example of chaining
// chart.columnForColors("Sex").columnForRadius("BirthCount");
// chart.customColors(["M","F"],["#70b7f0","#e76486"]).showTitleOnCircle(true);
// chart.title('Most popular baby names in 2016').columnForTitle("Name");
// chart.unitName("babies");
}

function tooltip(evt) {
    let x = evt.target.getAttribute('x');
    let y = evt.target.getAttribute('y');
    let xPosition = evt.target.getAttribute('cx');
    let yPosition = evt.target.getAttribute('cy');

    // clear all existing tooltips
    let tooltips = document.querySelectorAll('.tooltip');
    tooltips.forEach(value => {
        document.querySelector('#graphWrapper').removeChild(value);
    });

    // create the tooltip
    let tooltip = document.createElement('div');
    tooltip.setAttribute('class', 'tooltip');
    tooltip.setAttribute('id', `${makeId(xPosition, yPosition)}`);
    tooltip.innerHTML = `Year: ${x} <br> Count: ${y}`;
    tooltip.style.left = xPosition;
    tooltip.style.top = yPosition;
    document.querySelector('#graphWrapper').appendChild(tooltip);
}

function removeTooltip(evt) {
    let xPosition = evt.target.getAttribute('cx');
    let yPosition = evt.target.getAttribute('cy');
    document.querySelector('#graphWrapper').removeChild(
        document.querySelector(`#${makeId(xPosition, yPosition)}`)
    );
}

function saveSvg(svgEl, name) {
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    var svgData = svgEl.outerHTML;
    var preface = '<?xml version="1.0" standalone="no"?>\r\n';
    var svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function makeId(x, y) {
    return `d${parseInt(x)}x${parseInt(y)}`;
}

window.addEventListener('load', init, false);

function init() {
    data = {};
    document.querySelector('#queryBox').value = '';
    document.querySelector('.time-traveler').value = 2000;

    document.querySelector('.time-traveler').addEventListener('change', (event) => {
        makeBubbles();
    });

    document.querySelector('.time-traveler').addEventListener('input', (event) => {
        document.querySelector('.time-traveler-display').innerHTML = event.target.value;
    })

    document.getElementById('queryBox').addEventListener('keydown', (event) => {
        if (document.querySelector('#queryBox') != document.activeElement) {
            return;
        }

        if (event.key == "Enter") {
            makeBubbles();
            event.preventDefault();
        }
    });

    document.addEventListener('keydown', evt => {
        if (document.querySelector('#queryBox') == document.activeElement) {
            return;
        }

        
        if (evt.key == 'q') {
            document.querySelector('#queryBox').value = '';
            document.querySelector('#queryBox').focus();
            document.querySelector('#queryBox').select();
            evt.preventDefault();
        }
    
        if (evt.keyCode == 37) {
            document.querySelector('.time-traveler').value--;
            makeBubbles();
            document.querySelector('.time-traveler-display').innerHTML = document.querySelector('.time-traveler').value;
        }

        if (evt.keyCode == 39) {
            document.querySelector('.time-traveler').value++;
            makeBubbles();
            document.querySelector('.time-traveler-display').innerHTML = document.querySelector('.time-traveler').value;
        }
    })
}