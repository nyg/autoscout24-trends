## Stuff to do

* Crawler
    * fix date format and bool in CSV
    * use same date format in scrapy and spider logs
    * fix warning log for njsparser
* Frontend
    * add ability to order table by clicking on column headers, toggling between ascending and descending order, and showing an arrow to 
      indicate the current order, with the default order being by price (lowest to highest), taking into account that some values are numeric and some are text
    * add ability to select which columns to show in the table, with the default being current columns, and remembering the user's selection in 
      local storage, some columns shouldn't be shown at all (e.g. car id, seller id, batch id, etc) 
    * limit size of car description in table to 100 chars, adding a tooltip to show full description on hover keeping in mind that description 
      can be multiline
    * limit size of the seller name to e.g. 80 chars, adding a tooltip to show the full name on hover, and a link to google maps with the address
    * limit size of car title in table to 100 chrs, adding a tooltip to show full title on hover
    * add charts suggested in CHART_REVIEW.md
    * add a Settings tab to allow user to configure their home address, then add a second google maps link (one redirects to the seller page 
      in Maps, the other propose the itinierary from users home to seller), in the seller column also add a button to calculate and show the
      distance from home to seller using the Google Maps API (or another apropriate free API), and add a filter to the table to show only cars 
      within a certain distance from home 
