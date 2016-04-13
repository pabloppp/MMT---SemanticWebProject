
var app = angular.module("app", [])

.controller("mainCtrl", function($http, $timeout, dbpedia){

  var main = this;

  main.hello = "Hello world!"

  main.focusIn = function(id){
    document.getElementById(id).focus();
  }

  main.search = function(){
    main.results = [];
    if(!main.searchQuery) return;
    main.searching = true;
    if(main.searchTimeout) $timeout.cancel(main.searchTimeout);
    main.searchTimeout = $timeout(function(){
      dbpedia.search(main.searchQuery)
      .then(function(result){
        main.results = result.results.bindings;
        console.log(main.results);
        main.searching = false;
      })
    }, 500);
  }

  main.goToDocument = function(result){
    var id = result.s.value.split("/");
    id = id[id.length-1];
    var label = result.label.value;

    main.searchQuery = "actor:"+id+" #"+label
  }

})

.factory('dbpedia', function($http, $q){

  var searchPath = function(query){
    //query = query.replace(/ /g, "_");

    return "https://query.wikidata.org/bigdata/namespace/wdq/sparql?query=%0ASELECT%20DISTINCT%20%3Fs%20%3Flabel%20%3Fdescription%20%3Fthumbnail%20WHERE%20%7B%0A%20%7B%3Fs%20wdt%3AP31%20wd%3AQ11424%20%7D%20UNION%20%7B%3Fs%20wdt%3AP106%20wd%3AQ10800557%7D%20UNION%20%7B%3Fs%20wdt%3AP106%20wd%3AQ2526255%7D.%0A%20%3Fs%20rdfs%3Alabel%20%3Flabel%20.%0A%20OPTIONAL%20%7B%0A%20%20%20%3Fs%20wdt%3AP18%20%3Fthumbnail%20.%0A%20%20%20%3Fs%20schema%3Adescription%20%3Fdescription%20.%0A%20%20%20FILTER%20(lang(%3Fdescription)%20%3D%20%27en%27)%0A%20%7D%0A%20FILTER%20(lang(%3Flabel)%20%3D%20%27en%27)%0A%20FILTER(contains(lcase(%3Flabel)%2C%20lcase(%27"+query+"%27)))%20.%0A%7D%0ALIMIT%20100%0A";
  }

  var search = function(query){

    if(query.indexOf('#') != -1) query = query.substring(0, query.indexOf('#'));
    query = query.trim();
    query = encodeURI(query);

    var deferred = $q.defer();
    $http.get(searchPath(query))
    .success(function(result){
      deferred.resolve(result);
    })
    .error(function(err){
      deferred.resolve(err);
    })
    return deferred.promise;
  }

  return {
    search: search
  }

})
