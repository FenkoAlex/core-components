#!/bin/bash

# название подпакета => @alfalab/core-components-button => button = package_name
package_name=$(echo $1 | awk -F- '{print $3}')
# создаю дерикторию в корне проекта
mkdir -p ../../dist/$package_name
# копирую собранный подпакет в корневую сборку
cp -r dist/ ../../dist/$package_name
