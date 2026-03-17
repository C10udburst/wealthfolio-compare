fetching of data can be done in this format:

urls like:

https://d3t2nddjdn2vht.cloudfront.net/prod/kl-cl-conversion?countries=PL&variables=ahweal_p0p10_999_j,ahweal_p10p20_999_j&currency=cc&exchange=x&base=c&base_year=2024&decomposition=false


ahweal_p0p10_999_j - net personal wealth of the poorest 10% of the population
cc - current currency (note: the data is in current currency, not constant)
ahweal_p10p20_999_j - net personal wealth of the 10-20% of the population

response:
```

  "ahweal_p0p10_999_j": [
    {
      "PL": {
        "meta": {
          "unit_name": "Polish złoty",
          "data_points": null,
          "imputation": null,
          "extrapolation": null,
          "unit": "PLN",
          "unit_symbol": "zł",
          "data_quality": null
        },
        "values": [
          {
            "y": 2023,
            "v": -33889.2009
          },
          {
            "y": 2019,
            "v": -22437.7208
          },
          {
            "y": 2007,
            "v": -10602.4543
          },
          {
            "y": 2012,
            ...
```

- remember to truncate years to specified range (eg 1y/5y/10y)
- you may use binsearch to find the correct range of percentiles (eg p0p10, p10p20, etc) for current user wealth percentile


# Other variables that should be fetched:
`aptinc_p0p100_999_j` - average personal income of the population (all percentiles)
`ahwcud_p0p100_999_i` - average personal currency & deposits
`ahwbol_p0p100_999_i` - average personal bonds & loans
`ahweqi_p0p100_999_i` - average personal equities