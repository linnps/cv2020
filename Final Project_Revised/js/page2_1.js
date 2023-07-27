document.addEventListener('DOMContentLoaded', function () {
    const dataURL = 'https://raw.githubusercontent.com/linnps/files/main/Prices_Housing.csv';

    const margin = { top: 20, right: 20, bottom: 50, left: 70 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;


    function createLineChart(data, initialCity, startDate, endDate) {
        // Filter data for the selected city and date range
        const cityData = data.map(d => ({
            PeriodBegin: new Date(d.PeriodBegin),
            [initialCity]: +d[initialCity] || 0,
        })).filter(d => d.PeriodBegin >= startDate && d.PeriodBegin <= endDate);


        // Remove any existing SVG elements
        d3.select('#histogram-slide2_1').selectAll('*').remove();

        // Create the SVG element
        const svg = d3.select('#histogram-slide2_1')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .style("display", "block")
            .style('margin', "auto");

        // Add tooltip elements
        const tooltip = d3.select('body')
            .append('div')
            .attr('id', 'tooltip')
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('opacity', 0);

        // Create scales for x and y axes
        const xScale = d3.scaleTime()
            .domain(d3.extent(cityData, d => new Date(d.PeriodBegin)))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(cityData, d => d[initialCity]) * 0.95, d3.max(cityData, d => d[initialCity]) * 1.05])
            .range([height, 0]);

        // Create x and y axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        // Add x and y axes to the SVG
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis)
            .append('text')
            .attr('x', width / 2)
            .attr('y', 40)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .text('Date');

        svg.append('g')
            .call(yAxis)
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -60)
            .attr('x', -height / 2)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .text('Housing Price');

        // Create a line generator
        const line = d3.line()
            .x(d => xScale(d.PeriodBegin))
            .y(d => yScale(d[initialCity]));

        // Draw the line chart
        svg.append('path')
            .datum(cityData)
            .attr('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 2)
            .attr('d', line);

        // Add circles for data points
        svg.selectAll('circle')
            .data(cityData)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.PeriodBegin))
            .attr('cy', d => yScale(d[initialCity]))
            .attr('r', 5)
            .attr('fill', 'steelblue')
            .on('mouseover', function (event, d) {
                const tooltipHTML = `<strong>${initialCity}</strong><br>Date: ${d.PeriodBegin.toDateString()}<br>Price: ${d[initialCity]}`;

                tooltip.html(tooltipHTML)
                    .style('left', (event.clientX + 10) + 'px')
                    .style('top', (event.clientY - 28) + 'px')
                    .style('opacity', 0.9);
            })
            .on('mouseout', function () {
                tooltip.style('opacity', 0);
            });

        // Add an annotation for the trend line
        const annotation = d3.annotation()
            .type(d3.annotationLabel)
            .annotations([
                {
                    note: {
                        label:
                            'San Francisco Housing Price Variation\n' +
                            'Maximum Price: $1,295,000\n' +
                            'Minimum Price: $685,000\n' +
                            'Price Range: $610,000', // The text you want to display as the explanation
                        
                    },
                    x: width - 500, // X-coordinate of the arrow tail
                    y: 160, // Y-coordinate of the arrow tail (using the first data point's price)
                    dy: -180, // Adjustment for the vertical position of the annotation
                    dx: -80, // Adjustment for the horizontal position of the annotation
                    connector: {
                        end: 'arrow', // Display an arrow at the end of the connector line
                    },
                    color: 'red',
                },
            ]);

        // Append the annotation to the chart
        svg.append('g')
            .attr('class', 'annotation-group')
            .call(annotation);
    }

    // Fetch the data from the CSV URL
    d3.csv(dataURL).then(data => {
        // Convert the data to numbers and parse the date format
        const parseDate = d3.timeParse('%m/%d/%Y');
        data.forEach(d => {
            Object.keys(d).forEach(key => {
                if (key === 'PeriodBegin') {
                    // Parse the date using the custom parse function
                    d[key] = parseDate(d[key]);
                } else {
                    d[key] = +d[key];
                }
            });
        });

        // Find the minimum and maximum dates in the dataset
        const minDate = d3.min(data, d => d.PeriodBegin);
        const maxDate = d3.max(data, d => d.PeriodBegin);

        // Define the initial city and date range to display (e.g., "Boston" and entire date range)
        const initialCity = 'San Francisco';
        const initialStartDate = minDate;
        const initialEndDate = maxDate;

        // Call the createLineChart function with the data, initial city, and date range
        createLineChart(data, initialCity, initialStartDate, initialEndDate);

        // Get the city dropdown element and add event listener
        const cityDropdown = document.getElementById('isoCodeDropdown');
        cityDropdown.addEventListener('change', function () {
            const selectedCity = this.value;
            const startDate = new Date(document.getElementById('startDate2_1').value);
            const endDate = new Date(document.getElementById('endDate2_1').value);
            createLineChart(data, selectedCity, startDate, endDate);
        });

        // Populate the city dropdown with city options from the columns
        const cityOptions = Object.keys(data[0]).filter(key => key !== 'PeriodBegin');
        cityOptions.forEach(city => {
            const option = document.createElement('option');
            option.text = city;
            option.value = city;
            cityDropdown.appendChild(option);
        });

        // Get the date inputs and add event listener
        const startDateInput = document.getElementById('startDate2_1');
        const endDateInput = document.getElementById('endDate2_1');

        // Set the default values of the date inputs to the minimum and maximum dates in the dataset
        const formatDate = d3.timeFormat('%Y-%m-%d');
        startDateInput.value = formatDate(initialStartDate);
        endDateInput.value = formatDate(initialEndDate);

        // Update the chart when date inputs change
        startDateInput.addEventListener('change', function () {
            const selectedCity = cityDropdown.value;
            const startDate = new Date(this.value);
            const endDate = new Date(endDateInput.value);
            createLineChart(data, selectedCity, startDate, endDate);
        });
        endDateInput.addEventListener('change', function () {
            const selectedCity = cityDropdown.value;
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(this.value);
            createLineChart(data, selectedCity, startDate, endDate);
        });
    }).catch(error => {
        console.error('Error fetching data:', error);
    });
});