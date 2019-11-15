const port = 3000;
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
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom - 60 - 25;

function clear() {
    let graphs = document.getElementsByClassName('graph');
    for (let i = 0; i < graphs.length; i++) {
        if (graphs[i]) {
            graphs[i].style.opacity = '0';
            setTimeout(() => {
                graphs[i].remove();
            }, 300);
        }
    }
}

function updateGraph(string) {
    string = string.toLowerCase();
    query(string).then(() => {
        document.querySelector('.title').style.opacity = '1';
        document.querySelector('.legend-container').style.opacity = '1';
        clear();
        graph(string);
    })
}

function query(string) {
    return new Promise((resolve, reject) => {
        fetch(`/query/?phrase=${string}`)
            .then(res => res.json())
            .then(dataset => {
                processedData = new Array(166);
                for (let i = 0; i <= 166; i++) {
                    processedData[i] = { year: i + 1851, count: 0 };
                }
                for (i in dataset) {
                    processedData[parseInt(dataset[i].year) - 1851].count = dataset[i].count * yearCount[dataset[i].year];
                }
                data[string] = processedData;
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

function graph(string) {
    console.log(data);
    let n = 165;

    let maxValue = max();

    let xScale = d3.scaleLinear()
        .domain([1851, 2016])
        .range([0, width]);

    let yScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([height, 0]);

    let svg = d3.select('#graphWrapper')
        .append('svg')
        .attr('class', 'graph')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    svg.append('g')
        .attr('class', 'y axis')
        .call(d3.axisLeft(yScale));
        
    let line = d3.line()
        .x( (d, i) => xScale(d.year) )
        .y( d => yScale(d.count) )
        .curve(d3.curveMonotoneX);

    let count = 0;

    for (i in data) {
        svg.append('path')
            .datum(data[i])
            .attr('class', 'line')
            .attr('style', `stroke: ${materials[ (colourStart + ++count) % materials.length]}`)
            .attr('d', line);

        svg.selectAll('.nope')
            .data(data[i])
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', (d, i) => xScale(d.year))
            .attr('cy', (d) => yScale(d.count))
            .attr('x', d => d.year)
            .attr('y', d => d.count)
            .attr('r', 3)
            .attr('onmouseover', 'tooltip(evt)')
            .attr('onmouseout', 'removeTooltip(evt)');
        
    }
    
    document.querySelector('.legend-container').innerHTML += 
                `<div class='legend'>
                    <div style="background-color: ${materials[(colourStart + count) % materials.length]};"></div>
                    <p>${string}</p>
                    </div>`;

    setTimeout(() => {
        document.querySelector('.loading').style.opacity = '0';
        let graphs = document.getElementsByClassName('graph');
        for (let i = 0; i < graphs.length; i++) {
            if (graphs[i]) {
                graphs[i].style.opacity = '1';
            }
        }
    }, 100);
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

    document.getElementById('queryBox').addEventListener('keydown', (event) => {
        if (document.querySelector('#queryBox') != document.activeElement) {
            return;
        }

        if (event.key == "Enter") {
            updateGraph(event.target.value);
            document.querySelector('.loading').style.opacity = '1';
            document.querySelector('.instructions').style.opacity = '0.3';
            document.querySelector('#queryBox').focus();
            document.querySelector('#queryBox').blur();
            event.preventDefault();
        }
    });

    document.addEventListener('keydown', evt => {
        if (document.querySelector('#queryBox') == document.activeElement) {
            return;
        }

        
        if (evt.key == 'q') {
            document.querySelector('#queryBox').value = '';
            evt.preventDefault();
            document.querySelector('#queryBox').focus();
            document.querySelector('#queryBox').select();
        }

        if (evt.key == 'x') {
            data = {};
            clear();
            document.querySelector('#queryBox').value = '';
            document.querySelector('.instructions').style.opacity = '1';
            document.querySelector('#queryBox').focus();
            document.querySelector('#queryBox').select();
            document.querySelector('.legend-container').style.opacity = '0';
            setTimeout(() => {
                document.querySelector('.legend-container').innerHTML = '';
            }, 200);
            evt.preventDefault();
        }
    })
}