#!/usr/bin/env ruby

require 'csv'
require 'json'
require 'nokogiri'

source_path, format = ARGV
abort 'usage: extract_monevator.rb SOURCE.html json|csv' unless source_path && %w[json csv].include?(format)

document = Nokogiri::HTML(File.read(source_path))
tables = {
  'tablepress-7' => 'flat-fee',
  'tablepress-8' => 'percentage-fee',
  'tablepress-9' => 'trading-platform'
}.map do |id, name|
  table = document.at_css("##{id}")
  abort "missing table: #{id}" unless table
  rows = table.css('tr').map do |row|
    row.css('th, td').map { |cell| cell.text.gsub(/\s+/, ' ').strip }
  end.reject { |row| row.all?(&:empty?) }
  { id: id, name: name, columns: rows.first, rows: rows.drop(1) }
end

if format == 'json'
  puts JSON.pretty_generate({
    source: 'https://monevator.com/compare-uk-cheapest-online-brokers/',
    article_date: '2026-05-04',
    extracted_at: '2026-09-13',
    tables: tables
  })
else
  output = CSV.generate do |csv|
    csv << ['table', 'row', *tables.first[:columns]]
    tables.each do |table|
      table[:rows].each_with_index { |row, index| csv << [table[:name], index + 1, *row] }
    end
  end
  puts output
end
